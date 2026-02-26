import { credentials, type ServiceError } from '@grpc/grpc-js';
import { getServiceUrl, loadGrpcPackage } from '@crm/shared-kernel';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { CfastConfigService } from '../../../infrastructure/persistence/typeorm/repositories/cfast/cfast-config.service';
import { CfastApiClient } from '../../../infrastructure/external/cfast/cfast-api-client';
import { CfastConfigEntity } from '../entities/cfast-config.entity';
import { CfastInvoice } from '../types/cfast-api.types';
import { matchPhones, normalizePhone } from '../utils/phone-normalizer';

const STATUT_IMPORTEE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const EMISSION_CFAST_IMPORT_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
const CFAST_SOURCE_SYSTEM = 'CFAST';

interface ClientBaseRecord {
  id: string;
  nom?: string;
  prenom?: string;
  telephone?: string;
}

interface ListClientsRequest {
  organisation_id: string;
  search?: string;
  pagination: {
    page: number;
    limit: number;
    sort_by: string;
    sort_order: string;
  };
}

interface ListClientsResponse {
  clients?: ClientBaseRecord[];
  pagination?: {
    total_pages?: number;
    totalPages?: number;
  };
}

interface ClientBaseServiceGrpcContract {
  List(
    request: ListClientsRequest,
    callback: (error: ServiceError | null, response?: ListClientsResponse) => void,
  ): void;
}

interface FactureRecord {
  id: string;
  external_id?: string;
}

interface ListFacturesRequest {
  organisation_id: string;
  source_system?: string;
  pagination: {
    page: number;
    limit: number;
    sort_by: string;
    sort_order: string;
  };
}

interface ListFacturesResponse {
  factures?: FactureRecord[];
  pagination?: {
    total_pages?: number;
    totalPages?: number;
  };
}

interface CreateFactureGrpcLine {
  produit_id: string;
  quantite: number;
  prix_unitaire: number;
  description: string;
  taux_tva: number;
}

interface CreateFactureRequest {
  organisation_id: string;
  date_emission: string;
  statut_id: string;
  emission_facture_id: string;
  client_base_id: string;
  contrat_id: string;
  client_partenaire_id: string;
  adresse_facturation_id: string;
  lignes: CreateFactureGrpcLine[];
  source_system?: string;
  external_id?: string;
  imported_at?: string;
  numero?: string;
}

interface FactureServiceGrpcContract {
  List(
    request: ListFacturesRequest,
    callback: (error: ServiceError | null, response?: ListFacturesResponse) => void,
  ): void;
  Create(
    request: CreateFactureRequest,
    callback: (error: ServiceError | null, response?: { id: string }) => void,
  ): void;
}

export interface ImportResult {
  importedCount: number;
  skippedCount: number;
  errors: string[];
}

export interface ImportStatusResult {
  status: string;
  importedCount: number;
  skippedCount: number;
  errors: string[];
  lastSyncAt: string;
}

class CoreClientsGrpcClient {
  private readonly client: ClientBaseServiceGrpcContract;

  constructor() {
    const grpcPackage = loadGrpcPackage('clients');
    const ServiceConstructor = grpcPackage?.clients?.ClientBaseService;
    if (!ServiceConstructor) {
      throw new Error('ClientBaseService gRPC constructor not found in clients proto package');
    }

    const url = process.env.CLIENTS_GRPC_URL || process.env.SERVICE_CORE_GRPC_URL || getServiceUrl('clients');
    this.client = new ServiceConstructor(url, credentials.createInsecure());
  }

  async list(request: ListClientsRequest): Promise<ListClientsResponse> {
    return new Promise<ListClientsResponse>((resolve, reject) => {
      this.client.List(request, (error, response) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(response || { clients: [], pagination: { total_pages: 0 } });
      });
    });
  }
}

class FinanceFactureGrpcClient {
  private readonly client: FactureServiceGrpcContract;

  constructor() {
    const grpcPackage = loadGrpcPackage('factures');
    const ServiceConstructor = grpcPackage?.factures?.FactureService;
    if (!ServiceConstructor) {
      throw new Error('FactureService gRPC constructor not found in factures proto package');
    }

    const url = process.env.FINANCE_GRPC_URL || process.env.FACTURES_GRPC_URL || getServiceUrl('factures');
    this.client = new ServiceConstructor(url, credentials.createInsecure());
  }

  async list(request: ListFacturesRequest): Promise<ListFacturesResponse> {
    return new Promise<ListFacturesResponse>((resolve, reject) => {
      this.client.List(request, (error, response) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(response || { factures: [], pagination: { total_pages: 0 } });
      });
    });
  }

  async create(request: CreateFactureRequest): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.client.Create(request, (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

@Injectable()
export class CfastImportService {
  private readonly logger = new Logger(CfastImportService.name);

  constructor(
    private readonly cfastConfigService: CfastConfigService,
    private readonly cfastApiClient: CfastApiClient,
    @Optional() private readonly clientsService: CoreClientsGrpcClient = new CoreClientsGrpcClient(),
    @Optional() private readonly factureService: FinanceFactureGrpcClient = new FinanceFactureGrpcClient(),
  ) {}

  async importInvoices(organisationId: string): Promise<ImportResult> {
    const result: ImportResult = {
      importedCount: 0,
      skippedCount: 0,
      errors: [],
    };

    const config = await this.cfastConfigService.findByOrganisationId(organisationId);
    if (!config) {
      throw new Error(`CFAST config not found for organisation ${organisationId}`);
    }

    try {
      const token = await this.cfastApiClient.authenticate(config);
      const existingExternalIds = await this.loadExistingExternalIds(organisationId);
      const billingSessions = await this.cfastApiClient.listBillingSessions(token);

      if (billingSessions.length === 0) {
        await this.importInvoicesForSession(
          token,
          undefined,
          organisationId,
          existingExternalIds,
          result,
        );
      } else {
        for (const billingSession of billingSessions) {
          await this.importInvoicesForSession(
            token,
            billingSession.id,
            organisationId,
            existingExternalIds,
            result,
          );
        }
      }

      config.lastSyncAt = new Date();
      config.lastImportedCount = result.importedCount;
      config.syncError = result.errors.length > 0 ? result.errors.slice(0, 10).join(' | ') : null;
      await this.cfastConfigService.save(config);

      return result;
    } catch (error) {
      config.lastSyncAt = new Date();
      config.syncError = this.errorMessage(error);
      await this.cfastConfigService.save(config);
      throw error;
    }
  }

  async getImportStatus(organisationId: string): Promise<ImportStatusResult> {
    const config = await this.cfastConfigService.findByOrganisationId(organisationId);
    if (!config) {
      throw new Error(`CFAST config not found for organisation ${organisationId}`);
    }

    return {
      status: config.syncError ? 'ERROR' : config.lastSyncAt ? 'SUCCESS' : 'NEVER_SYNCED',
      importedCount: config.lastImportedCount || 0,
      skippedCount: 0,
      errors: config.syncError ? [config.syncError] : [],
      lastSyncAt: config.lastSyncAt?.toISOString() || '',
    };
  }

  private async importInvoicesForSession(
    token: string,
    billingSessionId: string | undefined,
    organisationId: string,
    existingExternalIds: Set<string>,
    result: ImportResult,
  ): Promise<void> {
    const invoices = await this.cfastApiClient.listInvoices(token, billingSessionId);

    for (const invoice of invoices) {
      try {
        await this.importSingleInvoice(invoice, organisationId, existingExternalIds);
        result.importedCount += 1;
      } catch (error) {
        const message = this.errorMessage(error);

        if (message.startsWith('SKIP:')) {
          result.skippedCount += 1;
          this.logger.warn(message.replace(/^SKIP:\s*/, ''));
          continue;
        }

        result.errors.push(message);
        this.logger.error(message);
      }
    }
  }

  private async importSingleInvoice(
    invoice: CfastInvoice,
    organisationId: string,
    existingExternalIds: Set<string>,
  ): Promise<void> {
    const externalId = this.resolveExternalId(invoice);
    if (existingExternalIds.has(externalId)) {
      throw new Error(`SKIP: facture already imported for externalId=${externalId}`);
    }

    const customerNom = this.extractInvoiceNom(invoice);
    const customerPrenom = this.extractInvoicePrenom(invoice);
    const customerPhoneRaw = this.extractInvoicePhone(invoice);
    const customerPhone = normalizePhone(customerPhoneRaw);

    if (!customerNom || !customerPrenom || !customerPhone) {
      throw new Error(
        `SKIP: missing customer fields for invoice=${externalId} (nom=${customerNom}, prenom=${customerPrenom}, telephone=${customerPhoneRaw})`,
      );
    }

    const matchedClient = await this.findMatchingClient(
      organisationId,
      customerNom,
      customerPrenom,
      customerPhone,
    );

    if (!matchedClient) {
      throw new Error(
        `SKIP: no client match for invoice=${externalId} (nom=${customerNom}, prenom=${customerPrenom}, telephone=${customerPhoneRaw})`,
      );
    }

    const montantHT = this.extractMontantHT(invoice);
    const montantTTC = this.extractMontantTTC(invoice, montantHT);
    const tauxTva = this.computeTauxTva(montantHT, montantTTC);
    const importedAt = new Date().toISOString();

    await this.factureService.create({
      organisation_id: organisationId,
      date_emission: this.extractDateEmission(invoice),
      statut_id: STATUT_IMPORTEE_ID,
      emission_facture_id: EMISSION_CFAST_IMPORT_ID,
      client_base_id: matchedClient.id,
      contrat_id: '',
      client_partenaire_id: '',
      adresse_facturation_id: '',
      source_system: CFAST_SOURCE_SYSTEM,
      external_id: externalId,
      imported_at: importedAt,
      numero: '',
      lignes: [
        {
          produit_id: '',
          quantite: 1,
          prix_unitaire: this.round(montantHT),
          description: `Import CFAST ${externalId}`,
          taux_tva: tauxTva,
        },
      ],
    });

    existingExternalIds.add(externalId);
  }

  private async loadExistingExternalIds(organisationId: string): Promise<Set<string>> {
    const externalIds = new Set<string>();
    let page = 1;

    for (;;) {
      const response = await this.factureService.list({
        organisation_id: organisationId,
        source_system: CFAST_SOURCE_SYSTEM,
        pagination: {
          page,
          limit: 200,
          sort_by: 'created_at',
          sort_order: 'DESC',
        },
      });

      const factures = response.factures || [];
      for (const facture of factures) {
        if (facture.external_id) {
          externalIds.add(facture.external_id);
        }
      }

      const totalPages = Number(response.pagination?.total_pages || response.pagination?.totalPages || 0);
      if (!factures.length || (totalPages > 0 && page >= totalPages)) {
        break;
      }

      page += 1;
    }

    return externalIds;
  }

  private async findMatchingClient(
    organisationId: string,
    nom: string,
    prenom: string,
    normalizedPhone: string,
  ): Promise<ClientBaseRecord | null> {
    const searchTerm = `${nom} ${prenom}`.trim();
    let page = 1;

    for (;;) {
      const response = await this.clientsService.list({
        organisation_id: organisationId,
        search: searchTerm,
        pagination: {
          page,
          limit: 100,
          sort_by: 'created_at',
          sort_order: 'DESC',
        },
      });

      const clients = response.clients || [];
      for (const client of clients) {
        if (
          this.normalizeName(client.nom) === this.normalizeName(nom) &&
          this.normalizeName(client.prenom) === this.normalizeName(prenom) &&
          matchPhones(client.telephone, normalizedPhone)
        ) {
          return client;
        }
      }

      const totalPages = Number(response.pagination?.total_pages || response.pagination?.totalPages || 0);
      if (!clients.length || (totalPages > 0 && page >= totalPages)) {
        break;
      }

      page += 1;
    }

    return null;
  }

  private normalizeName(value: string | null | undefined): string {
    return String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private resolveExternalId(invoice: CfastInvoice): string {
    const value = this.readString(invoice as Record<string, unknown>, [
      'external_id',
      'externalId',
      'id',
      'invoice_id',
      'numero',
      'number',
    ]);

    if (!value) {
      throw new Error('Invoice has no external id');
    }

    return value;
  }

  private extractInvoiceNom(invoice: CfastInvoice): string {
    const customer = this.getCustomer(invoice);
    return (
      this.readString(customer, ['nom', 'name', 'last_name', 'lastname']) ||
      this.readString(invoice as Record<string, unknown>, ['nom', 'last_name']) ||
      ''
    );
  }

  private extractInvoicePrenom(invoice: CfastInvoice): string {
    const customer = this.getCustomer(invoice);
    return (
      this.readString(customer, ['prenom', 'first_name', 'firstname']) ||
      this.readString(invoice as Record<string, unknown>, ['prenom', 'first_name']) ||
      ''
    );
  }

  private extractInvoicePhone(invoice: CfastInvoice): string {
    const customer = this.getCustomer(invoice);
    return (
      this.readString(customer, ['telephone', 'phone', 'mobile']) ||
      this.readString(invoice as Record<string, unknown>, ['telephone', 'phone']) ||
      ''
    );
  }

  private getCustomer(invoice: CfastInvoice): Record<string, unknown> {
    const candidate = (invoice as Record<string, unknown>).customer;
    if (candidate && typeof candidate === 'object') {
      return candidate as Record<string, unknown>;
    }

    return {};
  }

  private extractMontantHT(invoice: CfastInvoice): number {
    const value = this.readNumber(invoice as Record<string, unknown>, [
      'montant_ht',
      'montantHT',
      'amount_ht',
      'amountHT',
      'total_ht',
      'totalHT',
      'ht',
    ]);

    return this.round(value);
  }

  private extractMontantTTC(invoice: CfastInvoice, fallbackHT: number): number {
    const value = this.readNumber(invoice as Record<string, unknown>, [
      'montant_ttc',
      'montantTTC',
      'amount_ttc',
      'amountTTC',
      'total_ttc',
      'totalTTC',
      'ttc',
      'total',
    ]);

    return this.round(value || fallbackHT);
  }

  private extractDateEmission(invoice: CfastInvoice): string {
    return (
      this.readString(invoice as Record<string, unknown>, [
        'date_emission',
        'dateEmission',
        'emission_date',
        'issued_at',
        'date',
        'created_at',
      ]) || new Date().toISOString()
    );
  }

  private computeTauxTva(montantHT: number, montantTTC: number): number {
    if (montantHT <= 0 || montantTTC <= montantHT) {
      return 0;
    }

    return this.round(((montantTTC - montantHT) / montantHT) * 100);
  }

  private readString(source: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
      if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
      }
    }

    return null;
  }

  private readNumber(source: Record<string, unknown>, keys: string[]): number {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return 0;
  }

  private round(value: number): number {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
}
