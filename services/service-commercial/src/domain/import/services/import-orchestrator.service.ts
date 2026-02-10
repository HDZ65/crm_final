import { credentials, type ServiceError } from '@grpc/grpc-js';
import { getServiceUrl, loadGrpcPackage } from '@crm/shared-kernel';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';
import { ApporteurService } from '../../../infrastructure/persistence/typeorm/repositories/commercial/apporteur.service';
import { ProduitService } from '../../../infrastructure/persistence/typeorm/repositories/products/produit.service';
import { ContratService } from '../../../infrastructure/persistence/typeorm/repositories/contrats/contrat.service';
import { SubscriptionService } from '../../../infrastructure/persistence/typeorm/repositories/subscriptions/subscription.service';
import {
  ImportMapperService,
  type ExternalCommercialPayload,
  type ExternalContratPayload,
  type ExternalOffrePayload,
  type ExternalPaymentPayload,
  type ExternalProspectPayload,
  type ExternalSouscriptionPayload,
} from './import-mapper.service';

type UpsertOutcome = 'created' | 'updated' | 'skipped';

export interface ImportOrchestratorConfig {
  organisationId: string;
  apiUrl: string;
  apiKey: string;
  dryRun?: boolean;
  pageSize?: number;
}

export interface ImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ prospectExternalId: string; message: string }>;
}

interface SearchClientRequest {
  organisation_id: string;
  telephone: string;
  nom: string;
}

interface CreateClientRequest {
  organisation_id: string;
  type_client: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  compte_code: string;
  partenaire_id: string;
  telephone: string;
  email: string;
  statut: string;
  canal_acquisition: string;
}

interface UpdateClientRequest {
  id: string;
  nom?: string;
  prenom?: string;
  date_naissance?: string;
  compte_code?: string;
  partenaire_id?: string;
  telephone?: string;
  email?: string;
  statut?: string;
  canal_acquisition?: string;
}

interface ClientBaseResponse {
  id: string;
  updated_at?: string;
}

interface SearchClientResponse {
  found: boolean;
  client?: ClientBaseResponse;
}

interface ClientBaseServiceGrpcContract {
  Search(
    request: SearchClientRequest,
    callback: (error: ServiceError | null, response?: SearchClientResponse) => void,
  ): void;
  Create(
    request: CreateClientRequest,
    callback: (error: ServiceError | null, response?: ClientBaseResponse) => void,
  ): void;
  Update(
    request: UpdateClientRequest,
    callback: (error: ServiceError | null, response?: ClientBaseResponse) => void,
  ): void;
}

interface EnsureUserInput {
  id?: string;
  nom?: string;
  prenom?: string;
  email?: string;
}

interface UserResponse {
  id: string;
}

interface UserServiceGrpcContract {
  GetById?(
    request: { id: string },
    callback: (error: ServiceError | null, response?: UserResponse) => void,
  ): void;
  Create?(
    request: Record<string, unknown>,
    callback: (error: ServiceError | null, response?: UserResponse) => void,
  ): void;
}

interface PaymentInfoResponse {
  id: string;
  updated_at?: string;
}

interface PaymentInfoUpsertResponse {
  entity?: PaymentInfoResponse;
  created?: boolean;
}

interface PaymentInfoServiceGrpcContract {
  GetByExternalId?(
    request: { organisation_id: string; external_id: string },
    callback: (error: ServiceError | null, response?: PaymentInfoResponse) => void,
  ): void;
  UpsertByExternalId(
    request: Record<string, unknown>,
    callback: (error: ServiceError | null, response?: PaymentInfoUpsertResponse) => void,
  ): void;
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

  async search(request: SearchClientRequest): Promise<SearchClientResponse> {
    return new Promise<SearchClientResponse>((resolve, reject) => {
      this.client.Search(request, (error, response) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(response || { found: false });
      });
    });
  }

  async create(request: CreateClientRequest): Promise<ClientBaseResponse> {
    return new Promise<ClientBaseResponse>((resolve, reject) => {
      this.client.Create(request, (error, response) => {
        if (error) {
          reject(error);
          return;
        }
        if (!response) {
          reject(new Error('Client create returned an empty response'));
          return;
        }
        resolve(response);
      });
    });
  }

  async update(request: UpdateClientRequest): Promise<ClientBaseResponse> {
    return new Promise<ClientBaseResponse>((resolve, reject) => {
      this.client.Update(request, (error, response) => {
        if (error) {
          reject(error);
          return;
        }
        if (!response) {
          reject(new Error('Client update returned an empty response'));
          return;
        }
        resolve(response);
      });
    });
  }
}

class CoreUsersGrpcClient {
  private readonly logger = new Logger(CoreUsersGrpcClient.name);
  private readonly client: UserServiceGrpcContract | null;

  constructor() {
    this.client = this.resolveClient();
  }

  async ensureUser(input: EnsureUserInput, dryRun: boolean): Promise<string | null> {
    if (!input.id) {
      return null;
    }

    if (!this.client) {
      return input.id;
    }

    const getById = this.client.GetById;
    const create = this.client.Create;

    if (getById) {
      try {
        const existing = await new Promise<UserResponse>((resolve, reject) => {
          getById.call(this.client, { id: input.id || '' }, (error, response) => {
            if (error) {
              reject(error);
              return;
            }
            if (!response) {
              reject(new Error('User GetById returned an empty response'));
              return;
            }
            resolve(response);
          });
        });
        return existing.id;
      } catch {
        // Create fallback below.
      }
    }

    if (dryRun || !create) {
      return input.id;
    }

    try {
      const created = await new Promise<UserResponse>((resolve, reject) => {
        create.call(
          this.client,
          {
            id: input.id,
            nom: input.nom || '',
            prenom: input.prenom || '',
            email: input.email || '',
          },
          (error, response) => {
            if (error) {
              reject(error);
              return;
            }
            if (!response) {
              reject(new Error('User Create returned an empty response'));
              return;
            }
            resolve(response);
          },
        );
      });

      return created.id;
    } catch (error) {
      this.logger.warn(
        `Unable to create core user ${input.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return input.id;
    }
  }

  private resolveClient(): UserServiceGrpcContract | null {
    try {
      const grpcPackage = loadGrpcPackage('users');
      const serviceNamespace = grpcPackage?.users || grpcPackage?.utilisateurs || grpcPackage?.user;
      const ServiceConstructor =
        serviceNamespace?.UserService || serviceNamespace?.UtilisateurService || serviceNamespace?.UsersService;

      if (!ServiceConstructor) {
        return null;
      }

      const url = process.env.USERS_GRPC_URL || process.env.SERVICE_CORE_GRPC_URL || getServiceUrl('users');
      return new ServiceConstructor(url, credentials.createInsecure());
    } catch {
      return null;
    }
  }
}

class FinancePaymentInfoGrpcClient {
  private readonly client: PaymentInfoServiceGrpcContract;

  constructor() {
    const grpcPackage = loadGrpcPackage('payment-info');
    const ServiceConstructor =
      grpcPackage?.payment_info?.InformationPaiementBancaireService ||
      grpcPackage?.payments?.InformationPaiementBancaireService;

    if (!ServiceConstructor) {
      throw new Error(
        'InformationPaiementBancaireService gRPC constructor not found in payment-info proto package',
      );
    }

    const url = process.env.FINANCE_GRPC_URL || process.env.PAYMENTS_GRPC_URL || getServiceUrl('payments');
    this.client = new ServiceConstructor(url, credentials.createInsecure());
  }

  async getByExternalId(
    organisationId: string,
    externalId: string,
  ): Promise<PaymentInfoResponse | null> {
    if (!this.client.GetByExternalId) {
      return null;
    }

    try {
      return await new Promise<PaymentInfoResponse>((resolve, reject) => {
        this.client.GetByExternalId?.(
          {
            organisation_id: organisationId,
            external_id: externalId,
          },
          (error, response) => {
            if (error) {
              reject(error);
              return;
            }
            if (!response) {
              reject(new Error('GetByExternalId returned an empty response'));
              return;
            }
            resolve(response);
          },
        );
      });
    } catch {
      return null;
    }
  }

  async upsertByExternalId(request: Record<string, unknown>): Promise<PaymentInfoUpsertResponse> {
    return new Promise<PaymentInfoUpsertResponse>((resolve, reject) => {
      this.client.UpsertByExternalId(request, (error, response) => {
        if (error) {
          reject(error);
          return;
        }
        if (!response) {
          reject(new Error('UpsertByExternalId returned an empty response'));
          return;
        }
        resolve(response);
      });
    });
  }
}

@Injectable()
export class ImportOrchestratorService {
  private readonly logger = new Logger(ImportOrchestratorService.name);

  constructor(
    private readonly mapper: ImportMapperService,
    private readonly apporteurService: ApporteurService,
    private readonly produitService: ProduitService,
    private readonly contratService: ContratService,
    private readonly subscriptionService: SubscriptionService,
    @Optional() private readonly coreClientsGrpcClient: CoreClientsGrpcClient = new CoreClientsGrpcClient(),
    @Optional() private readonly coreUsersGrpcClient: CoreUsersGrpcClient = new CoreUsersGrpcClient(),
    @Optional()
    private readonly financePaymentInfoGrpcClient: FinancePaymentInfoGrpcClient =
      new FinancePaymentInfoGrpcClient(),
  ) {}

  async importAll(config: ImportOrchestratorConfig): Promise<ImportResult> {
    const prospects = await this.fetchProspects(config);
    const result: ImportResult = {
      total: prospects.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    for (const prospect of prospects) {
      const prospectExternalId = this.mapper.toExternalId(prospect.idProspect, 'prospect');
      try {
        const commercial = await this.upsertCommercial(config, prospect);
        this.applyOutcome(result, commercial.outcome);

        const client = await this.upsertClient(config, prospect);
        this.applyOutcome(result, client.outcome);

        const offres = await this.upsertOffres(config, prospect);
        offres.forEach((outcome) => this.applyOutcome(result, outcome));

        const contrats = await this.upsertContrats(config, prospect, client.id, commercial.apporteurId);
        contrats.outcomes.forEach((outcome) => this.applyOutcome(result, outcome));

        const souscriptions = await this.upsertSouscriptions(config, prospect, client.id, contrats.byExternalId);
        souscriptions.forEach((outcome) => this.applyOutcome(result, outcome));

        const paiements = await this.upsertPaiements(config, prospect, client.id);
        paiements.forEach((outcome) => this.applyOutcome(result, outcome));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Import failed for prospect ${prospectExternalId}: ${message}`);
        result.errors.push({
          prospectExternalId,
          message,
        });
        result.skipped += 1;
      }
    }

    return result;
  }

  private async fetchProspects(config: ImportOrchestratorConfig): Promise<ExternalProspectPayload[]> {
    const all: ExternalProspectPayload[] = [];
    const pageSize = config.pageSize || 100;
    let page = 1;

    while (true) {
      const url = new URL('/api/prospects', config.apiUrl);
      url.searchParams.set('has_contrats', 'true');
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', String(pageSize));

      let response: Response;
      try {
        response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'X-API-Key': config.apiKey,
            Accept: 'application/json',
          },
        });
      } catch (error) {
        throw new Error(
          `Failed to fetch prospects page ${page}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      if (!response.ok) {
        throw new Error(`Prospects API returned HTTP ${response.status} for page ${page}`);
      }

      const payload = (await response.json()) as unknown;

      if (Array.isArray(payload)) {
        all.push(...(payload as ExternalProspectPayload[]));
        break;
      }

      const objectPayload = payload as Record<string, unknown>;
      const pageItems = this.resolveProspectArray(objectPayload);
      all.push(...pageItems);

      const hasMore = this.hasMorePages(objectPayload, page, pageItems.length, pageSize);
      if (!hasMore) {
        break;
      }

      page += 1;
    }

    return all;
  }

  private async upsertCommercial(
    config: ImportOrchestratorConfig,
    prospect: ExternalProspectPayload,
  ): Promise<{ outcome: UpsertOutcome; apporteurId: string }> {
    const commercial = this.mapper.resolveCommercialPayload(prospect);
    const mapped = this.mapper.mapCommercialToApporteur(commercial);
    const sourceTimestamp = this.resolveSourceTimestamp(commercial, prospect);

    const ensuredUserId = await this.coreUsersGrpcClient.ensureUser(
      {
        id: mapped.utilisateurId || undefined,
        nom: mapped.nom,
        prenom: mapped.prenom,
        email: mapped.email || undefined,
      },
      Boolean(config.dryRun),
    );

    const utilisateurId = ensuredUserId || mapped.utilisateurId;
    let existing: { id: string; updatedAt: Date } | null = null;

    if (utilisateurId) {
      try {
        const current = await this.apporteurService.findByUtilisateur(utilisateurId);
        existing = {
          id: current.id,
          updatedAt: current.updatedAt,
        };
      } catch {
        existing = null;
      }
    }

    if (existing && !this.shouldApplyIncoming(existing.updatedAt, sourceTimestamp)) {
      return { outcome: 'skipped', apporteurId: existing.id };
    }

    if (config.dryRun) {
      if (existing) {
        return { outcome: 'updated', apporteurId: existing.id };
      }

      return {
        outcome: 'created',
        apporteurId: `dry-commercial-${this.mapper.toExternalId(commercial.id, 'commercial')}`,
      };
    }

    if (existing) {
      const updated = await this.apporteurService.update(existing.id, {
        utilisateurId,
        nom: mapped.nom,
        prenom: mapped.prenom,
        email: mapped.email,
        telephone: mapped.telephone,
        typeApporteur: mapped.typeApporteur,
        actif: mapped.actif,
      });
      return { outcome: 'updated', apporteurId: updated.id };
    }

    const created = await this.apporteurService.create({
      organisationId: config.organisationId,
      utilisateurId,
      nom: mapped.nom,
      prenom: mapped.prenom,
      email: mapped.email,
      telephone: mapped.telephone,
      typeApporteur: mapped.typeApporteur,
      actif: mapped.actif,
    });

    return { outcome: 'created', apporteurId: created.id };
  }

  private async upsertClient(
    config: ImportOrchestratorConfig,
    prospect: ExternalProspectPayload,
  ): Promise<{ outcome: UpsertOutcome; id: string }> {
    const mapped = this.mapper.mapProspectToClientBase(prospect);
    const sourceTimestamp = this.resolveSourceTimestamp(prospect);

    const search = await this.coreClientsGrpcClient.search({
      organisation_id: config.organisationId,
      telephone: mapped.telephone,
      nom: mapped.nom,
    });

    const existing = search.found ? search.client || null : null;

    if (existing && !this.shouldApplyIncoming(existing.updated_at, sourceTimestamp)) {
      return { outcome: 'skipped', id: existing.id };
    }

    if (config.dryRun) {
      if (existing) {
        return { outcome: 'updated', id: existing.id };
      }
      return {
        outcome: 'created',
        id: `dry-client-${this.mapper.toExternalId(prospect.idProspect, 'prospect')}`,
      };
    }

    if (existing) {
      const updated = await this.coreClientsGrpcClient.update({
        id: existing.id,
        nom: mapped.nom,
        prenom: mapped.prenom,
        date_naissance: mapped.date_naissance,
        compte_code: mapped.compte_code,
        partenaire_id: mapped.partenaire_id,
        telephone: mapped.telephone,
        email: mapped.email,
        statut: mapped.statut,
        canal_acquisition: mapped.canal_acquisition,
      });
      return { outcome: 'updated', id: updated.id };
    }

    const created = await this.coreClientsGrpcClient.create({
      organisation_id: config.organisationId,
      ...mapped,
    });

    return { outcome: 'created', id: created.id };
  }

  private async upsertOffres(
    config: ImportOrchestratorConfig,
    prospect: ExternalProspectPayload,
  ): Promise<UpsertOutcome[]> {
    const outcomes: UpsertOutcome[] = [];
    const souscriptions = prospect.Souscription || [];

    for (const souscription of souscriptions) {
      const sourceOffre = souscription.offre;
      if (!sourceOffre && !souscription.offreId) {
        continue;
      }

      const offrePayload: ExternalOffrePayload = {
        ...sourceOffre,
        offreId: sourceOffre?.offreId ?? souscription.offreId,
        totalAmount: sourceOffre?.totalAmount ?? souscription.totalAmount,
        devise: sourceOffre?.devise ?? souscription.devise,
        created_at: sourceOffre?.created_at ?? souscription.created_at,
        updated_at: sourceOffre?.updated_at ?? souscription.updated_at,
      };

      const mapped = this.mapper.mapOffreToProduitInput(offrePayload);
      const sourceTimestamp = this.resolveSourceTimestamp(offrePayload, souscription, prospect);
      const existing = await this.findProduitBySku(config.organisationId, mapped.sku);

      if (existing && !this.shouldApplyIncoming(existing.updatedAt, sourceTimestamp)) {
        outcomes.push('skipped');
        continue;
      }

      if (config.dryRun) {
        outcomes.push(existing ? 'updated' : 'created');
        continue;
      }

      if (existing) {
        await this.produitService.update({
          id: existing.id,
          sku: mapped.sku,
          nom: mapped.nom,
          description: mapped.description,
          categorie: mapped.categorie,
          type: mapped.type,
          statut_cycle: mapped.statut_cycle,
          prix: mapped.prix,
          taux_tva: mapped.taux_tva,
          devise: mapped.devise,
          code_externe: mapped.code_externe,
          metadata: mapped.metadata,
          actif: true,
        });
        outcomes.push('updated');
      } else {
        await this.produitService.create({
          organisation_id: config.organisationId,
          sku: mapped.sku,
          nom: mapped.nom,
          description: mapped.description,
          categorie: mapped.categorie,
          type: mapped.type,
          statut_cycle: mapped.statut_cycle,
          prix: mapped.prix,
          taux_tva: mapped.taux_tva,
          devise: mapped.devise,
          code_externe: mapped.code_externe,
          metadata: mapped.metadata,
        });
        outcomes.push('created');
      }
    }

    return outcomes;
  }

  private async upsertContrats(
    config: ImportOrchestratorConfig,
    prospect: ExternalProspectPayload,
    clientId: string,
    commercialId: string,
  ): Promise<{ outcomes: UpsertOutcome[]; byExternalId: Map<string, string> }> {
    const outcomes: UpsertOutcome[] = [];
    const byExternalId = new Map<string, string>();

    const souscriptions = prospect.Souscription || [];
    for (const souscription of souscriptions) {
      for (const contratPayload of souscription.contrats || []) {
        const mapped = this.mapper.mapContratToContratInput(contratPayload, clientId, commercialId);
        const sourceTimestamp = this.resolveSourceTimestamp(contratPayload, souscription, prospect);
        const existing = await this.findContratByReference(config.organisationId, mapped.reference);

        if (existing && !this.shouldApplyIncoming(existing.updatedAt, sourceTimestamp)) {
          outcomes.push('skipped');
          byExternalId.set(mapped.externalId, existing.id);
          continue;
        }

        if (config.dryRun) {
          outcomes.push(existing ? 'updated' : 'created');
          byExternalId.set(
            mapped.externalId,
            existing?.id || `dry-contrat-${mapped.externalId}`,
          );
          continue;
        }

        if (existing) {
          const updated = await this.contratService.update({
            id: existing.id,
            reference: mapped.reference,
            titre: mapped.titre,
            description: mapped.description,
            type: mapped.type,
            statut: mapped.statut,
            dateDebut: mapped.dateDebut,
            dateFin: mapped.dateFin,
            dateSignature: mapped.dateSignature,
            montant: mapped.montant,
            devise: mapped.devise,
            frequenceFacturation: mapped.frequenceFacturation,
            documentUrl: mapped.documentUrl,
            fournisseur: mapped.fournisseur,
            clientId: mapped.clientId,
            commercialId: mapped.commercialId,
            notes: mapped.notes,
          });
          outcomes.push('updated');
          byExternalId.set(mapped.externalId, updated.id);
        } else {
          const created = await this.contratService.create({
            organisationId: config.organisationId,
            reference: mapped.reference,
            titre: mapped.titre,
            description: mapped.description,
            type: mapped.type,
            statut: mapped.statut,
            dateDebut: mapped.dateDebut,
            dateFin: mapped.dateFin,
            dateSignature: mapped.dateSignature,
            montant: mapped.montant,
            devise: mapped.devise,
            frequenceFacturation: mapped.frequenceFacturation,
            documentUrl: mapped.documentUrl,
            fournisseur: mapped.fournisseur,
            clientId: mapped.clientId,
            commercialId: mapped.commercialId,
            notes: mapped.notes,
          });
          outcomes.push('created');
          byExternalId.set(mapped.externalId, created.id);
        }
      }
    }

    return { outcomes, byExternalId };
  }

  private async upsertSouscriptions(
    config: ImportOrchestratorConfig,
    prospect: ExternalProspectPayload,
    clientId: string,
    contratsByExternalId: Map<string, string>,
  ): Promise<UpsertOutcome[]> {
    const outcomes: UpsertOutcome[] = [];

    for (const souscription of prospect.Souscription || []) {
      const firstContrat = (souscription.contrats || [])[0];
      const contratExternalId = this.mapper.toExternalId(
        firstContrat?.idContrat ?? firstContrat?.id,
        'contrat',
      );
      const mapped = this.mapper.mapSouscriptionToSubscriptionInput(
        souscription,
        clientId,
        contratsByExternalId.get(contratExternalId) || null,
      );

      const sourceTimestamp = this.resolveSourceTimestamp(souscription, prospect);
      const existing = await this.findSubscriptionByExternalId(config.organisationId, clientId, mapped.externalId);

      if (existing && !this.shouldApplyIncoming(existing.updatedAt, sourceTimestamp)) {
        outcomes.push('skipped');
        continue;
      }

      if (config.dryRun) {
        outcomes.push(existing ? 'updated' : 'created');
        continue;
      }

      if (existing) {
        await this.subscriptionService.update({
          id: existing.id,
          planType: mapped.planType,
          storeSource: mapped.storeSource,
          contratId: mapped.contratId || undefined,
          status: mapped.status,
          frequency: mapped.frequency,
          amount: mapped.amount,
          currency: mapped.currency,
          startDate: mapped.startDate,
          endDate: mapped.endDate,
          nextChargeAt: mapped.nextChargeAt,
          imsSubscriptionId: mapped.imsSubscriptionId,
        });
        outcomes.push('updated');
      } else {
        await this.subscriptionService.create({
          organisationId: config.organisationId,
          clientId: mapped.clientId,
          planType: mapped.planType,
          storeSource: mapped.storeSource,
          contratId: mapped.contratId || undefined,
          status: mapped.status,
          frequency: mapped.frequency,
          amount: mapped.amount,
          currency: mapped.currency,
          startDate: mapped.startDate,
          endDate: mapped.endDate,
          nextChargeAt: mapped.nextChargeAt,
          imsSubscriptionId: mapped.imsSubscriptionId,
        });
        outcomes.push('created');
      }
    }

    return outcomes;
  }

  private async upsertPaiements(
    config: ImportOrchestratorConfig,
    prospect: ExternalProspectPayload,
    clientId: string,
  ): Promise<UpsertOutcome[]> {
    const outcomes: UpsertOutcome[] = [];

    for (const payment of prospect.informationsPaiement || []) {
      const externalId = this.mapper.toExternalId(payment.idInfoPaiement, 'payment');
      const sourceTimestamp = this.resolveSourceTimestamp(payment, prospect);

      const existing = await this.financePaymentInfoGrpcClient.getByExternalId(
        config.organisationId,
        externalId,
      );

      if (existing && !this.shouldApplyIncoming(existing.updated_at, sourceTimestamp)) {
        outcomes.push('skipped');
        continue;
      }

      if (config.dryRun) {
        outcomes.push(existing ? 'updated' : 'created');
        continue;
      }

      const request = this.mapper.mapPaymentToFinanceUpsert(payment, clientId, sourceTimestamp || undefined);

      const response = await this.financePaymentInfoGrpcClient.upsertByExternalId({
        organisation_id: config.organisationId,
        ...request,
      });

      outcomes.push(response.created ? 'created' : existing ? 'updated' : 'created');
    }

    return outcomes;
  }

  private async findProduitBySku(
    organisationId: string,
    sku: string,
  ): Promise<{ id: string; updatedAt: Date } | null> {
    try {
      const produit = await this.produitService.findBySku(organisationId, sku);
      return {
        id: produit.id,
        updatedAt: produit.updatedAt,
      };
    } catch {
      return null;
    }
  }

  private async findContratByReference(
    organisationId: string,
    reference: string,
  ): Promise<{ id: string; updatedAt: Date } | null> {
    try {
      const contrat = await this.contratService.findByReference(organisationId, reference);
      return {
        id: contrat.id,
        updatedAt: contrat.updatedAt,
      };
    } catch (error) {
      if (error instanceof RpcException) {
        const rpcError = error.getError() as { code?: number };
        if (rpcError?.code === status.NOT_FOUND) {
          return null;
        }
      }
      return null;
    }
  }

  private async findSubscriptionByExternalId(
    organisationId: string,
    clientId: string,
    externalId: string,
  ): Promise<{ id: string; updatedAt: Date } | null> {
    const list = await this.subscriptionService.findAll(
      {
        organisationId,
        clientId,
      },
      { page: 1, limit: 500 },
    );

    const match = list.subscriptions.find((item) => item.imsSubscriptionId === externalId);
    if (!match) {
      return null;
    }

    return {
      id: match.id,
      updatedAt: match.updatedAt,
    };
  }

  private resolveProspectArray(payload: Record<string, unknown>): ExternalProspectPayload[] {
    const candidates = [
      payload.data,
      payload.prospects,
      payload.items,
      payload.results,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate as ExternalProspectPayload[];
      }
    }

    return [];
  }

  private hasMorePages(
    payload: Record<string, unknown>,
    currentPage: number,
    pageSizeCount: number,
    pageSize: number,
  ): boolean {
    const pagination = payload.pagination as Record<string, unknown> | undefined;
    const meta = payload.meta as Record<string, unknown> | undefined;

    const totalPages = Number(pagination?.total_pages ?? meta?.total_pages ?? 0);
    if (!Number.isNaN(totalPages) && totalPages > 0) {
      return currentPage < totalPages;
    }

    if (payload.next_page_url) {
      return true;
    }

    return pageSizeCount >= pageSize;
  }

  private resolveSourceTimestamp(...objects: Array<unknown>): string | null {
    for (const object of objects) {
      if (!object || typeof object !== 'object') {
        continue;
      }

      const source = object as Record<string, unknown>;

      const updatedAt = this.readString(source, ['updated_at', 'updatedAt']);
      if (updatedAt) {
        return updatedAt;
      }

      const createdAt = this.readString(source, ['created_at', 'createdAt']);
      if (createdAt) {
        return createdAt;
      }
    }

    return null;
  }

  private shouldApplyIncoming(
    existingUpdatedAt?: Date | string | null,
    incomingTimestamp?: Date | string | null,
  ): boolean {
    if (!existingUpdatedAt) {
      return true;
    }

    if (!incomingTimestamp) {
      return true;
    }

    const existingDate = new Date(existingUpdatedAt);
    const incomingDate = new Date(incomingTimestamp);

    if (Number.isNaN(existingDate.getTime()) || Number.isNaN(incomingDate.getTime())) {
      return true;
    }

    return incomingDate.getTime() >= existingDate.getTime();
  }

  private readString(source: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return null;
  }

  private applyOutcome(result: ImportResult, outcome: UpsertOutcome): void {
    if (outcome === 'created') {
      result.created += 1;
      return;
    }
    if (outcome === 'updated') {
      result.updated += 1;
      return;
    }
    result.skipped += 1;
  }
}
