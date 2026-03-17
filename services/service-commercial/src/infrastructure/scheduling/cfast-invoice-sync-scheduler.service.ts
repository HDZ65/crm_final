import { credentials, type ServiceError } from '@grpc/grpc-js';
import { getServiceUrl, loadGrpcPackage } from '@crm/shared-kernel';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CfastInvoice } from '../../domain/cfast/types/cfast-api.types';
import { CfastConfigService } from '../persistence/typeorm/repositories/cfast/cfast-config.service';
import { CfastApiClient } from '../external/cfast/cfast-api-client';
import { CfastEntityMappingService } from '../persistence/typeorm/repositories/cfast/cfast-entity-mapping.service';

const CRM_ENTITY_TYPE_CLIENT = 'CLIENT';
const CFAST_ENTITY_TYPE_CUSTOMER = 'CUSTOMER';
const CFAST_SOURCE_SYSTEM = 'CFAST';
const FACTURE_STATUT_PENDING_PAYMENT =
  process.env.CFAST_FACTURE_STATUT_ID || 'EN_ATTENTE_PAIEMENT';
const FACTURE_EMISSION_CFAST_IMPORT_ID =
  process.env.CFAST_FACTURE_EMISSION_ID || 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

interface GetGoCardlessMandateRequest {
  client_id: string;
  societe_id: string;
}

interface GoCardlessMandateResponse {
  id: string;
  mandate_id?: string;
  status?: string;
}

interface CreatePaymentIntentGrpcRequest {
  organisation_id: string;
  societe_id: string;
  psp_name: string;
  amount: number;
  currency: string;
  mandate_reference?: string;
  idempotency_key?: string;
  metadata: Record<string, string>;
}

interface PaymentIntentGrpcResponse {
  id: string;
  status?: string;
}

interface PaymentServiceGrpcContract {
  GetGoCardlessMandate(
    request: GetGoCardlessMandateRequest,
    callback: (error: ServiceError | null, response?: GoCardlessMandateResponse) => void,
  ): void;
  CreatePaymentIntent(
    request: CreatePaymentIntentGrpcRequest,
    callback: (error: ServiceError | null, response?: PaymentIntentGrpcResponse) => void,
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

interface UpdateFactureRequest {
  id: string;
  statut_id?: string;
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
  Update(
    request: UpdateFactureRequest,
    callback: (error: ServiceError | null, response?: { id: string }) => void,
  ): void;
}

class FinancePaymentGrpcClient {
  private readonly client: PaymentServiceGrpcContract;

  constructor() {
    const grpcPackage = loadGrpcPackage('payments');
    const ServiceConstructor = grpcPackage?.payment?.PaymentService;
    if (!ServiceConstructor) {
      throw new Error('PaymentService gRPC constructor not found in payments proto package');
    }

    const url = process.env.FINANCE_GRPC_URL || process.env.PAYMENTS_GRPC_URL || getServiceUrl('payments');
    this.client = new ServiceConstructor(url, credentials.createInsecure());
  }

  async getGoCardlessMandate(request: GetGoCardlessMandateRequest): Promise<GoCardlessMandateResponse> {
    return new Promise<GoCardlessMandateResponse>((resolve, reject) => {
      this.client.GetGoCardlessMandate(request, (error, response) => {
        if (error) {
          reject(error);
          return;
        }

        if (!response) {
          reject(new Error('GetGoCardlessMandate returned empty response'));
          return;
        }

        resolve(response);
      });
    });
  }

  async createPaymentIntent(request: CreatePaymentIntentGrpcRequest): Promise<PaymentIntentGrpcResponse> {
    return new Promise<PaymentIntentGrpcResponse>((resolve, reject) => {
      this.client.CreatePaymentIntent(request, (error, response) => {
        if (error) {
          reject(error);
          return;
        }

        if (!response) {
          reject(new Error('CreatePaymentIntent returned empty response'));
          return;
        }

        resolve(response);
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

  async update(request: UpdateFactureRequest): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.client.Update(request, (error) => {
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
export class CfastInvoiceSyncSchedulerService {
  private readonly logger = new Logger(CfastInvoiceSyncSchedulerService.name);

  private isImportRunning = false;

  constructor(
    private readonly cfastConfigService: CfastConfigService,
    private readonly cfastApiClient: CfastApiClient,
    private readonly cfastEntityMappingService: CfastEntityMappingService,
    @Optional() private readonly paymentService: FinancePaymentGrpcClient = new FinancePaymentGrpcClient(),
    @Optional() private readonly factureService: FinanceFactureGrpcClient = new FinanceFactureGrpcClient(),
  ) {}

  @Cron('0 6 * * *', {
    name: 'cfast-invoice-sync',
    timeZone: 'UTC',
  })
  async handleDailyInvoiceSync(): Promise<void> {
    const jobName = 'cfast-invoice-sync';

    if (this.isImportRunning) {
      this.logger.warn(`[${jobName}] Sync already in progress, skipping`);
      return;
    }

    this.isImportRunning = true;

    try {
      const activeConfigs = await this.cfastConfigService.findAllActive();

      for (const config of activeConfigs) {
        await this.syncOrganisation(config.organisationId);
      }
    } catch (error) {
      this.logger.error(
        `[${jobName}] Daily sync failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.isImportRunning = false;
    }
  }

  async syncOrganisation(organisationId: string): Promise<void> {
    const config = await this.cfastConfigService.findByOrganisationId(organisationId);
    if (!config) {
      return;
    }

    const counters = {
      fetched: 0,
      matched: 0,
      charged: 0,
      skippedNoMapping: 0,
      skippedNoMandate: 0,
      skippedZeroAmount: 0,
      skippedPaid: 0,
      skippedOther: 0,
    };

    try {
      const token = await this.cfastApiClient.authenticate(config);
      const allInvoices = await this.cfastApiClient.listInvoices(token);
      const unpaidInvoices = allInvoices.filter((invoice) => this.isUnpaidInvoice(invoice));

      counters.fetched = unpaidInvoices.length;

      const mappings = await this.cfastEntityMappingService.findAllByOrg(organisationId);
      const customerToClientMap = new Map<string, string>();
      for (const mapping of mappings) {
        if (
          mapping.crmEntityType === CRM_ENTITY_TYPE_CLIENT &&
          mapping.cfastEntityType === CFAST_ENTITY_TYPE_CUSTOMER &&
          mapping.cfastEntityId
        ) {
          customerToClientMap.set(String(mapping.cfastEntityId), mapping.crmEntityId);
        }
      }

      const existingFactures = await this.loadExistingFacturesByExternalId(organisationId);

      for (const invoice of unpaidInvoices) {
        const externalId = this.resolveInvoiceExternalId(invoice);
        if (!externalId) {
          counters.skippedOther += 1;
          continue;
        }

        const amountCents = this.extractInvoiceAmountCents(invoice);
        if (amountCents <= 0) {
          counters.skippedZeroAmount += 1;
          continue;
        }

        const customerId = this.resolveInvoiceCustomerId(invoice);
        const clientId = customerId ? customerToClientMap.get(customerId) : undefined;
        if (!clientId) {
          counters.skippedNoMapping += 1;
          this.logger.warn(
            `Org ${organisationId}: skip invoice ${externalId} - no CRM mapping for CFAST customer ${customerId || 'unknown'}`,
          );
          continue;
        }

        counters.matched += 1;

        const mandate = await this.tryGetMandate(organisationId, clientId);
        if (!mandate || !this.isMandateActive(mandate.status)) {
          counters.skippedNoMandate += 1;
          this.logger.warn(
            `Org ${organisationId}: skip invoice ${externalId} - no active GoCardless mandate for client ${clientId}`,
          );
          continue;
        }

        const factureId = existingFactures.get(externalId);
        if (factureId) {
          try {
            await this.factureService.update({
              id: factureId,
              statut_id: FACTURE_STATUT_PENDING_PAYMENT,
            });
          } catch (error) {
            this.logger.warn(
              `Org ${organisationId}: unable to update facture ${factureId} for invoice ${externalId}: ${this.errorMessage(error)}`,
            );
          }
        } else {
          await this.factureService.create({
            organisation_id: organisationId,
            date_emission: this.extractDateEmission(invoice),
            statut_id: FACTURE_STATUT_PENDING_PAYMENT,
            emission_facture_id: FACTURE_EMISSION_CFAST_IMPORT_ID,
            client_base_id: clientId,
            contrat_id: '',
            client_partenaire_id: '',
            adresse_facturation_id: '',
            source_system: CFAST_SOURCE_SYSTEM,
            external_id: externalId,
            imported_at: new Date().toISOString(),
            numero: '',
            lignes: [
              {
                produit_id: '',
                quantite: 1,
                prix_unitaire: this.toMajorUnit(amountCents),
                description: `CFAST ${externalId}`,
                taux_tva: 0,
              },
            ],
          });
        }

        const idempotencyKey = `cfast:${organisationId}:${externalId}`;
        try {
          await this.paymentService.createPaymentIntent({
            organisation_id: organisationId,
            societe_id: organisationId,
            psp_name: 'GOCARDLESS',
            amount: amountCents,
            currency: this.extractCurrency(invoice),
            mandate_reference: mandate.mandate_id || mandate.id,
            idempotency_key: idempotencyKey,
            metadata: {
              source: CFAST_SOURCE_SYSTEM,
              cfast_invoice_id: externalId,
              cfast_customer_id: customerId || '',
              client_id: clientId,
            },
          });

          counters.charged += 1;
        } catch (error) {
          this.logger.error(
            `Org ${organisationId}: payment intent failed for invoice ${externalId}: ${this.errorMessage(error)}`,
          );
        }
      }

      config.lastSyncAt = new Date();
      config.lastImportedCount = counters.charged;
      config.syncError = null;
      await this.cfastConfigService.save(config);
    } catch (error) {
      config.lastSyncAt = new Date();
      config.syncError = this.errorMessage(error);
      await this.cfastConfigService.save(config);
      this.logger.error(
        `Org ${organisationId}: sync failed - ${this.errorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    const skippedTotal =
      counters.skippedNoMapping +
      counters.skippedNoMandate +
      counters.skippedZeroAmount +
      counters.skippedPaid +
      counters.skippedOther;

    this.logger.log(
      `Org ${organisationId}: fetched ${counters.fetched} invoices, matched ${counters.matched}, charged ${counters.charged}, skipped ${skippedTotal} (no mapping: ${counters.skippedNoMapping}, no mandate: ${counters.skippedNoMandate}, zero amount: ${counters.skippedZeroAmount})`,
    );
  }

  private async loadExistingFacturesByExternalId(
    organisationId: string,
  ): Promise<Map<string, string>> {
    const map = new Map<string, string>();
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
          map.set(facture.external_id, facture.id);
        }
      }

      const totalPages = Number(response.pagination?.total_pages || response.pagination?.totalPages || 0);
      if (!factures.length || (totalPages > 0 && page >= totalPages)) {
        break;
      }

      page += 1;
    }

    return map;
  }

  private async tryGetMandate(
    organisationId: string,
    clientId: string,
  ): Promise<GoCardlessMandateResponse | null> {
    try {
      return await this.paymentService.getGoCardlessMandate({
        client_id: clientId,
        societe_id: organisationId,
      });
    } catch {
      return null;
    }
  }

  private isMandateActive(statusValue: string | undefined): boolean {
    return String(statusValue || '')
      .trim()
      .toUpperCase() === 'ACTIVE';
  }

  private isUnpaidInvoice(invoice: CfastInvoice): boolean {
    const source = invoice as Record<string, unknown>;
    const status = String(
      source.status || source.payment_status || source.paymentStatus || source.state || '',
    )
      .trim()
      .toUpperCase();

    if (status.includes('PAID') || status.includes('PAYEE') || status === 'REGLEE') {
      return false;
    }

    const paidAt = source.paid_at || source.paidAt || source.date_paiement || source.paymentDate;
    if (typeof paidAt === 'string' && paidAt.trim()) {
      return false;
    }

    return true;
  }

  private resolveInvoiceExternalId(invoice: CfastInvoice): string | null {
    const source = invoice as Record<string, unknown>;
    const candidate =
      this.readString(source, ['id', 'external_id', 'externalId', 'invoice_id', 'number', 'numero']) ||
      null;
    return candidate;
  }

  private resolveInvoiceCustomerId(invoice: CfastInvoice): string | null {
    const source = invoice as Record<string, unknown>;
    const customer = source.customer;
    if (customer && typeof customer === 'object') {
      const fromNested = this.readString(customer as Record<string, unknown>, [
        'id',
        'customer_id',
        'customerId',
      ]);
      if (fromNested) {
        return fromNested;
      }
    }

    return this.readString(source, ['customer_id', 'customerId', 'client_id', 'clientId']);
  }

  private extractInvoiceAmountCents(invoice: CfastInvoice): number {
    const source = invoice as Record<string, unknown>;
    const amountMajor = this.readNumber(source, [
      'montant_ttc',
      'montantTTC',
      'amount_ttc',
      'amountTTC',
      'total_ttc',
      'totalTTC',
      'total',
      'amount',
      'amount_due',
      'amountDue',
    ]);

    return Math.round((amountMajor + Number.EPSILON) * 100);
  }

  private toMajorUnit(cents: number): number {
    return Math.round(((Number(cents || 0) / 100) + Number.EPSILON) * 100) / 100;
  }

  private extractCurrency(invoice: CfastInvoice): string {
    const source = invoice as Record<string, unknown>;
    return (
      this.readString(source, ['currency', 'devise']) ||
      process.env.CFAST_INVOICE_DEFAULT_CURRENCY ||
      'EUR'
    );
  }

  private extractDateEmission(invoice: CfastInvoice): string {
    const source = invoice as Record<string, unknown>;
    return (
      this.readString(source, [
        'date_emission',
        'dateEmission',
        'emission_date',
        'issued_at',
        'date',
        'created_at',
      ]) || new Date().toISOString()
    );
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
