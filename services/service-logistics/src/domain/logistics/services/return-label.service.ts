import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { RetourExpeditionEntity, RetourExpeditionStatus } from '../entities/retour-expedition.entity';
import { ExpeditionService } from '../../../infrastructure/persistence/typeorm/repositories/logistics';
import { RetourExpeditionService } from '../../../infrastructure/persistence/typeorm/repositories/logistics/retour-expedition.service';
import { MailevaService } from '../../../infrastructure/external/maileva';

/**
 * Domain service orchestrating return label creation.
 *
 * Flow: validate expedition → generate label via Maileva → persist RetourExpeditionEntity
 * Atomic: if Maileva fails, nothing is persisted.
 */
@Injectable()
export class ReturnLabelService {
  private readonly logger = new Logger(ReturnLabelService.name);

  /** Valid expedition states that allow a return label request */
  private static readonly RETURNABLE_STATES = new Set([
    'delivered',
    'livré',
    'LIVRE',
    'LIVRÉ',
  ]);

  /** Allowed status transitions for retour expeditions */
  private static readonly STATUS_FLOW: Record<RetourExpeditionStatus, RetourExpeditionStatus | null> = {
    [RetourExpeditionStatus.DEMANDE]: RetourExpeditionStatus.ETIQUETTE_GENEREE,
    [RetourExpeditionStatus.ETIQUETTE_GENEREE]: RetourExpeditionStatus.EN_TRANSIT,
    [RetourExpeditionStatus.EN_TRANSIT]: RetourExpeditionStatus.RECU,
    [RetourExpeditionStatus.RECU]: null, // terminal state
  };

  constructor(
    private readonly expeditionService: ExpeditionService,
    private readonly retourExpeditionService: RetourExpeditionService,
    private readonly mailevaService: MailevaService,
  ) {}

  /**
   * Create a return label for an existing expedition.
   *
   * 1. Validates the expedition exists and is in a returnable state (LIVRE / delivered)
   * 2. Calls Maileva to generate a return shipping label
   * 3. Persists a RetourExpeditionEntity with status ETIQUETTE_GENEREE
   *
   * If Maileva fails the entity is NOT persisted (atomic).
   */
  async createReturnLabel(
    expeditionId: string,
    reason: string,
    clientId: string,
  ): Promise<RetourExpeditionEntity> {
    this.logger.log(`Creating return label for expedition ${expeditionId}, client ${clientId}`);

    // 1. Validate expedition exists
    const expedition = await this.expeditionService.findById(expeditionId);
    if (!expedition) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Expedition ${expeditionId} not found`,
      });
    }

    // 2. Validate expedition is in a returnable state
    if (!ReturnLabelService.RETURNABLE_STATES.has(expedition.etat)) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: `Expedition ${expeditionId} is in state '${expedition.etat}' — return labels are only allowed for delivered expeditions`,
      });
    }

    // 3. Generate return label via Maileva (before any persistence)
    let labelResult: { trackingNumber: string; labelUrl: string };
    try {
      labelResult = await this.mailevaService.generateLabel({
        serviceLevel: 'standard',
        format: 'A4',
        recipient: {
          line1: expedition.adresseDestination || '',
          postalCode: expedition.codePostalDestination || '',
          city: expedition.villeDestination || '',
          country: 'FR',
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown Maileva error';
      this.logger.error(`Maileva label generation failed for expedition ${expeditionId}: ${message}`);
      throw new RpcException({
        code: status.UNAVAILABLE,
        message: `Return label generation failed: ${message}`,
      });
    }

    // 4. Persist the retour expedition entity with status ETIQUETTE_GENEREE
    const retourExpedition = await this.retourExpeditionService.create({
      expeditionId,
      reason,
    });

    // 5. Immediately transition DEMANDE → ETIQUETTE_GENEREE with label data
    const updated = await this.retourExpeditionService.updateStatus(
      retourExpedition.id,
      RetourExpeditionStatus.ETIQUETTE_GENEREE,
      {
        trackingNumber: labelResult.trackingNumber,
        labelUrl: labelResult.labelUrl,
      },
    );

    this.logger.log(`Return label created: ${updated.id} (tracking: ${updated.trackingNumber})`);
    return updated;
  }

  /**
   * Validates that a status transition is allowed according to the status flow:
   * DEMANDE → ETIQUETTE_GENEREE → EN_TRANSIT → RECU
   */
  static isValidTransition(from: RetourExpeditionStatus, to: RetourExpeditionStatus): boolean {
    return ReturnLabelService.STATUS_FLOW[from] === to;
  }
}
