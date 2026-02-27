import { credentials, type ServiceError } from '@grpc/grpc-js';
import { getServiceUrl, loadGrpcPackage } from '@crm/shared-kernel';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { CfastConfigService } from '../../../infrastructure/persistence/typeorm/repositories/cfast/cfast-config.service';
import { CfastApiClient } from '../../../infrastructure/external/cfast/cfast-api-client';
import { CfastEntityMappingService } from '../../../infrastructure/persistence/typeorm/repositories/cfast/cfast-entity-mapping.service';

// ─── gRPC Interfaces (mirror clients.proto ClientBase) ───

interface ClientBaseGrpc {
  id: string;
  organisation_id?: string;
  nom?: string;
  prenom?: string;
  telephone?: string;
  email?: string;
  adresses?: AdresseGrpc[];
}

interface AdresseGrpc {
  id?: string;
  ligne1?: string;
  ligne2?: string;
  code_postal?: string;
  ville?: string;
  pays?: string;
  type?: string;
}

interface GetClientBaseRequest {
  id: string;
}

interface ClientBaseServiceGrpcContract {
  Get(
    request: GetClientBaseRequest,
    callback: (error: ServiceError | null, response?: ClientBaseGrpc) => void,
  ): void;
}

// ─── gRPC Client (same pattern as CfastImportService) ───

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

  async get(request: GetClientBaseRequest): Promise<ClientBaseGrpc> {
    return new Promise<ClientBaseGrpc>((resolve, reject) => {
      this.client.Get(request, (error, response) => {
        if (error) {
          reject(error);
          return;
        }

        if (!response) {
          reject(new Error('Empty response from ClientBaseService.Get'));
          return;
        }

        resolve(response);
      });
    });
  }
}

// ─── CRM / CFAST Entity Type Constants ───

const CRM_ENTITY_TYPE = 'CLIENT';
const CFAST_TYPE_CUSTOMER = 'CUSTOMER';
const CFAST_TYPE_BILLING_POINT = 'BILLING_POINT';
const CFAST_TYPE_SITE = 'SITE';

// ─── Service ───

@Injectable()
export class CfastClientPushService {
  private readonly logger = new Logger(CfastClientPushService.name);

  constructor(
    private readonly cfastConfigService: CfastConfigService,
    private readonly cfastApiClient: CfastApiClient,
    private readonly cfastEntityMappingService: CfastEntityMappingService,
    @Optional() private readonly clientsGrpc: CoreClientsGrpcClient = new CoreClientsGrpcClient(),
  ) {}

  /**
   * Push a CRM client to CFAST by creating the full hierarchy:
   * Customer → BillingPoint → Site
   *
   * Idempotent: checks all 3 mappings (CUSTOMER, BILLING_POINT, SITE).
   * If all exist, returns immediately. If partially complete (e.g. CUSTOMER exists
   * but SITE does not), resumes from the last successful step.
   * On partial failure, partial mappings are kept and error is thrown with step indicator.
   */
  async pushClient(
    organisationId: string,
    clientId: string,
  ): Promise<{ cfastCustomerId: string }> {
    // ── Step 0: Idempotency — check if full hierarchy already exists ──
    const [existingCustomer, existingBillingPoint, existingSite] = await Promise.all([
      this.cfastEntityMappingService.findMapping(organisationId, CRM_ENTITY_TYPE, clientId, CFAST_TYPE_CUSTOMER),
      this.cfastEntityMappingService.findMapping(organisationId, CRM_ENTITY_TYPE, clientId, CFAST_TYPE_BILLING_POINT),
      this.cfastEntityMappingService.findMapping(organisationId, CRM_ENTITY_TYPE, clientId, CFAST_TYPE_SITE),
    ]);

    if (existingCustomer && existingBillingPoint && existingSite) {
      this.logger.log(
        `Client ${clientId} already fully pushed to CFAST (customerId=${existingCustomer.cfastEntityId})`,
      );
      return { cfastCustomerId: existingCustomer.cfastEntityId };
    }

    if (existingCustomer) {
      this.logger.log(
        `Client ${clientId} partially pushed — resuming from ${existingBillingPoint ? 'SITE' : 'BILLING_POINT'}`,
      );
    }

    // ── Step 1: Load CFAST config & authenticate ──
    const config = await this.cfastConfigService.findByOrganisationId(organisationId);
    if (!config) {
      throw new Error(`CFAST config not found for organisation ${organisationId}`);
    }

    const token = await this.cfastApiClient.authenticate(config);

    // ── Step 2: Fetch CRM client via gRPC ──
    const crmClient = await this.clientsGrpc.get({ id: clientId });
    const displayName = `${crmClient.prenom || ''} ${crmClient.nom || ''}`.trim() || clientId;

    // ── Step 3: Create CFAST Customer (skip if already exists) ──
    let cfastCustomerId: string;
    if (existingCustomer) {
      cfastCustomerId = existingCustomer.cfastEntityId;
    } else {
      try {
        const customerResponse = await this.cfastApiClient.createCustomer(token, {
          firstName: crmClient.prenom || undefined,
          lastName: crmClient.nom || undefined,
          name: displayName,
          email: crmClient.email || undefined,
          phone: crmClient.telephone || undefined,
        });
        cfastCustomerId = customerResponse.id;
      } catch (error) {
        throw new Error(
          `CFAST push failed at step CUSTOMER for client ${clientId}: ${this.errorMessage(error)}`,
        );
      }

      // Store CLIENT→CUSTOMER mapping immediately (partial progress preserved)
      await this.cfastEntityMappingService.upsertMapping({
        organisationId,
        crmEntityType: CRM_ENTITY_TYPE,
        crmEntityId: clientId,
        cfastEntityType: CFAST_TYPE_CUSTOMER,
        cfastEntityId: cfastCustomerId,
      });

      // ── Step 3b: Create CFAST Customer Address (best-effort, non-blocking, only on first push) ──
      const primaryAddress = crmClient.adresses?.[0];
      if (primaryAddress) {
        try {
          await this.cfastApiClient.createCustomerAddress(token, cfastCustomerId, {
            street:
              [primaryAddress.ligne1, primaryAddress.ligne2].filter(Boolean).join(', ') || undefined,
            city: primaryAddress.ville || undefined,
            postalCode: primaryAddress.code_postal || undefined,
            country: primaryAddress.pays || 'FR',
          });
        } catch (error) {
          this.logger.warn(
            `CFAST push: address creation failed for customer ${cfastCustomerId}: ${this.errorMessage(error)}`,
          );
          // Non-blocking — continue with billing point creation
        }
      }
    }

    // ── Step 4: Create CFAST BillingPoint (skip if already exists) ──
    let cfastBillingPointId: string;
    if (existingBillingPoint) {
      cfastBillingPointId = existingBillingPoint.cfastEntityId;
    } else {
      try {
        const bpResponse = await this.cfastApiClient.createBillingPoint(token, cfastCustomerId, {
          name: displayName,
        });
        cfastBillingPointId = bpResponse.id;
      } catch (error) {
        throw new Error(
          `CFAST push failed at step BILLING_POINT (customer=${cfastCustomerId}) for client ${clientId}: ${this.errorMessage(error)}`,
        );
      }

      // Store CLIENT→BILLING_POINT mapping immediately
      await this.cfastEntityMappingService.upsertMapping({
        organisationId,
        crmEntityType: CRM_ENTITY_TYPE,
        crmEntityId: clientId,
        cfastEntityType: CFAST_TYPE_BILLING_POINT,
        cfastEntityId: cfastBillingPointId,
      });
    }

    // ── Step 5: Create CFAST Site (skip if already exists) ──
    let cfastSiteId: string;
    if (existingSite) {
      cfastSiteId = existingSite.cfastEntityId;
    } else {
      try {
        const siteResponse = await this.cfastApiClient.createSite(token, cfastBillingPointId, {
          name: displayName,
        });
        cfastSiteId = siteResponse.id;
      } catch (error) {
        throw new Error(
          `CFAST push failed at step SITE (billingPoint=${cfastBillingPointId}) for client ${clientId}: ${this.errorMessage(error)}`,
        );
      }

      // Store CLIENT→SITE mapping immediately
      await this.cfastEntityMappingService.upsertMapping({
        organisationId,
        crmEntityType: CRM_ENTITY_TYPE,
        crmEntityId: clientId,
        cfastEntityType: CFAST_TYPE_SITE,
        cfastEntityId: cfastSiteId,
      });
    }

    this.logger.log(
      `Client ${clientId} pushed to CFAST: customer=${cfastCustomerId}, billingPoint=${cfastBillingPointId}, site=${cfastSiteId}`,
    );

    return { cfastCustomerId };
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
