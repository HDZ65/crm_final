import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsService, getServiceUrl, loadGrpcPackage } from '@crm/shared-kernel';
import { credentials, type ServiceError } from '@grpc/grpc-js';
import { CfastConfigService } from '../../../persistence/typeorm/repositories/cfast/cfast-config.service';
import { CfastApiClient } from '../../../external/cfast/cfast-api-client';

// ---------------------------------------------------------------------------
// NATS event shape (published by GoCardless webhook handler)
// ---------------------------------------------------------------------------

export interface PaymentGocardlessSucceededEvent {
  factureId: string;
  amount: number;
  currency: string;
  provider: string;
  goCardlessPaymentId: string;
  metadata?: {
    cfastInvoiceId?: string;
    organisationId?: string;
    [key: string]: unknown;
  };
}

// ---------------------------------------------------------------------------
// gRPC contracts (service-finance FactureService + StatutFactureService)
// ---------------------------------------------------------------------------

interface FactureGrpcMessage {
  id: string;
  organisation_id: string;
  source_system?: string;
  external_id?: string;
  statut_id: string;
}

interface StatutFactureGrpcMessage {
  id: string;
  code: string;
  nom: string;
}

interface FactureServiceGrpc {
  Get(
    request: { id: string },
    callback: (error: ServiceError | null, response?: FactureGrpcMessage) => void,
  ): void;
  Update(
    request: { id: string; statut_id?: string },
    callback: (error: ServiceError | null, response?: FactureGrpcMessage) => void,
  ): void;
}

interface StatutFactureServiceGrpc {
  GetByCode(
    request: { code: string },
    callback: (error: ServiceError | null, response?: StatutFactureGrpcMessage) => void,
  ): void;
}

// ---------------------------------------------------------------------------
// gRPC helper — talks to service-finance
// ---------------------------------------------------------------------------

class FinanceGrpcHelper {
  private readonly factureClient: FactureServiceGrpc;
  private readonly statutClient: StatutFactureServiceGrpc;

  constructor() {
    const grpcPackage = loadGrpcPackage('factures');

    const FactureServiceCtor = (grpcPackage as any)?.factures?.FactureService;
    const StatutCtor = (grpcPackage as any)?.factures?.StatutFactureService;

    if (!FactureServiceCtor) {
      throw new Error('FactureService gRPC constructor not found in factures proto package');
    }
    if (!StatutCtor) {
      throw new Error('StatutFactureService gRPC constructor not found in factures proto package');
    }

    const url =
      process.env.FINANCE_GRPC_URL ||
      process.env.FACTURES_GRPC_URL ||
      getServiceUrl('factures');

    this.factureClient = new FactureServiceCtor(url, credentials.createInsecure());
    this.statutClient = new StatutCtor(url, credentials.createInsecure());
  }

  async getFacture(id: string): Promise<FactureGrpcMessage | null> {
    return new Promise((resolve, reject) => {
      this.factureClient.Get({ id }, (error, response) => {
        if (error) {
          // NOT_FOUND = 5
          if (error.code === 5) {
            resolve(null);
            return;
          }
          reject(error);
          return;
        }
        resolve(response ?? null);
      });
    });
  }

  async updateFactureStatut(id: string, statutId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.factureClient.Update({ id, statut_id: statutId }, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  async getStatutByCode(code: string): Promise<StatutFactureGrpcMessage | null> {
    return new Promise((resolve, reject) => {
      this.statutClient.GetByCode({ code }, (error, response) => {
        if (error) {
          if (error.code === 5) {
            resolve(null);
            return;
          }
          reject(error);
          return;
        }
        resolve(response ?? null);
      });
    });
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/**
 * NATS handler for payment.gocardless.succeeded.
 *
 * When a GoCardless payment succeeds for a CFAST invoice:
 * 1. Authenticate with CFAST API
 * 2. Mark the bill as paid in CFAST (non-fatal 404)
 * 3. Update facture status to PAYEE via gRPC to service-finance
 *
 * Non-CFAST invoices are silently ignored.
 */
@Injectable()
export class CfastPaymentBridgeHandler implements OnModuleInit {
  private readonly logger = new Logger(CfastPaymentBridgeHandler.name);
  private financeGrpc: FinanceGrpcHelper | null = null;
  private payeeStatutId: string | null = null;

  constructor(
    private readonly natsService: NatsService,
    private readonly cfastConfigService: CfastConfigService,
    private readonly cfastApiClient: CfastApiClient,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log(
      'CfastPaymentBridgeHandler initialized — ready for payment.gocardless.succeeded',
    );

    // Initialize gRPC helper (non-blocking — log warning if finance service unavailable)
    try {
      this.financeGrpc = new FinanceGrpcHelper();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to initialize finance gRPC helper: ${msg}`);
    }

    // Resolve PAYEE statut ID (lazy fallback in handle() if this fails)
    this.resolvePayeeStatutId().catch((err) => {
      this.logger.warn(
        `Failed to resolve PAYEE statut on init: ${err instanceof Error ? err.message : String(err)}`,
      );
    });

    await this.natsService.subscribe<PaymentGocardlessSucceededEvent>(
      'payment.gocardless.succeeded',
      this.handle.bind(this),
    );
  }

  async handle(event: PaymentGocardlessSucceededEvent): Promise<void> {
    const cfastInvoiceId = event.metadata?.cfastInvoiceId;

    // Non-CFAST invoices are silently ignored (no error)
    if (!cfastInvoiceId) {
      this.logger.debug(
        `Ignoring payment.gocardless.succeeded for non-CFAST facture=${event.factureId}`,
      );
      return;
    }

    this.logger.log(
      `Processing CFAST payment bridge: facture=${event.factureId}, cfastBill=${cfastInvoiceId}`,
    );

    try {
      // Resolve organisationId — prefer metadata, fallback to gRPC lookup
      let organisationId = event.metadata?.organisationId as string | undefined;

      if (!organisationId && this.financeGrpc) {
        const facture = await this.financeGrpc.getFacture(event.factureId);
        if (!facture) {
          this.logger.warn(`Facture ${event.factureId} not found via gRPC, skipping`);
          return;
        }
        if (facture.source_system !== 'CFAST') {
          this.logger.debug(`Facture ${event.factureId} is not CFAST (source=${facture.source_system}), skipping`);
          return;
        }
        organisationId = facture.organisation_id;
      }

      if (!organisationId) {
        this.logger.warn(`No organisationId for facture ${event.factureId}, cannot authenticate with CFAST`);
        return;
      }

      // Step 1: Authenticate with CFAST
      const config = await this.cfastConfigService.findByOrganisationId(organisationId);
      if (!config) {
        this.logger.warn(`No CFAST config for organisation ${organisationId}, skipping mark-paid`);
        return;
      }

      const token = await this.cfastApiClient.authenticate(config);

      // Step 2: Mark bill as paid in CFAST (non-fatal 404 handled by CfastApiClient)
      await this.cfastApiClient.markBillAsPaid(token, cfastInvoiceId, {
        paidAt: new Date().toISOString(),
        amount: event.amount,
        paymentMethod: 'GOCARDLESS',
      });

      this.logger.log(`CFAST bill ${cfastInvoiceId} marked as paid (or 404 accepted)`);

      // Step 3: Update facture status to PAYEE via gRPC
      await this.updateFactureStatutToPayee(event.factureId);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to process CFAST payment bridge for facture=${event.factureId}: ${msg}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private async resolvePayeeStatutId(): Promise<void> {
    if (this.payeeStatutId || !this.financeGrpc) return;

    const statut = await this.financeGrpc.getStatutByCode('PAYEE');
    if (statut) {
      this.payeeStatutId = statut.id;
      this.logger.log(`Resolved PAYEE statut ID: ${this.payeeStatutId}`);
    } else {
      this.logger.warn('PAYEE statut not found via gRPC — facture status updates will be skipped');
    }
  }

  private async updateFactureStatutToPayee(factureId: string): Promise<void> {
    if (!this.financeGrpc) {
      this.logger.warn('Finance gRPC helper not available — skipping facture status update');
      return;
    }

    // Lazy resolve if not done at init
    if (!this.payeeStatutId) {
      await this.resolvePayeeStatutId();
    }

    if (!this.payeeStatutId) {
      this.logger.warn('PAYEE statut ID not resolved — skipping facture status update');
      return;
    }

    try {
      await this.financeGrpc.updateFactureStatut(factureId, this.payeeStatutId);
      this.logger.log(`Facture ${factureId} status updated to PAYEE`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to update facture ${factureId} status to PAYEE: ${msg}`);
    }
  }
}
