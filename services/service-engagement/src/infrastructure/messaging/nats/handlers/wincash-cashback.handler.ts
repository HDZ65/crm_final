import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  OperationCashback,
  CashbackStatut,
  CashbackType,
} from '../../../../domain/services/entities/operation-cashback.entity';

/**
 * Handler for WinCash cashback events via NATS
 * Subjects: wincash.cashback.created, wincash.cashback.updated, wincash.cashback.validated, wincash.cashback.expired
 *
 * NOTE: NATS subscription will be wired when @crm/nats-utils is added.
 * Currently exposes handler methods for direct invocation or gRPC relay.
 */
@Injectable()
export class WincashCashbackHandler implements OnModuleInit {
  private readonly logger = new Logger(WincashCashbackHandler.name);

  constructor(
    @InjectRepository(OperationCashback)
    private readonly operationCashbackRepository: Repository<OperationCashback>,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('WincashCashbackHandler initialized - ready to process cashback events');
    // TODO: Wire NATS subscriptions when nats-utils is available
    // await this.natsService.subscribeProto('wincash.cashback.*', this.handleEvent.bind(this));
  }

  async handleCashbackCreated(data: {
    externalId: string;
    customerId: string;
    contratId: string;
    organisationId: string;
    type: string;
    montantAchat: number;
    tauxCashback: number;
    montantCashback: number;
    dateAchat: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<OperationCashback> {
    this.logger.log(`Processing wincash.cashback.created: ${data.externalId}`);

    try {
      // Check for duplicate by reference
      const existing = await this.operationCashbackRepository.findOne({
        where: { reference: data.externalId },
      });

      if (existing) {
        this.logger.warn(`Cashback operation already exists: ${data.externalId}, skipping`);
        return existing;
      }

      const operation = this.operationCashbackRepository.create({
        organisationId: data.organisationId,
        clientId: data.customerId,
        reference: data.externalId,
        type: this.mapCashbackType(data.type),
        statut: CashbackStatut.EN_ATTENTE,
        montantAchat: data.montantAchat,
        tauxCashback: data.tauxCashback,
        montantCashback: data.montantCashback,
        dateAchat: data.dateAchat ? new Date(data.dateAchat) : undefined,
        description: data.description,
        metadata: data.metadata,
      } as Partial<OperationCashback>) as OperationCashback;

      const saved = await this.operationCashbackRepository.save(operation);
      this.logger.debug(`Cashback operation created: ${saved.id} (ref=${data.externalId})`);
      return saved;
    } catch (error: any) {
      this.logger.error(`Failed to process cashback.created: ${data.externalId}`, error.stack);
      throw error;
    }
  }

  async handleCashbackValidated(data: {
    externalId: string;
    validePar?: string;
    dateValidation: string;
  }): Promise<void> {
    this.logger.log(`Processing wincash.cashback.validated: ${data.externalId}`);

    try {
      const operation = await this.operationCashbackRepository.findOne({
        where: { reference: data.externalId },
      });

      if (!operation) {
        this.logger.warn(`Cashback operation not found for validation: ${data.externalId}`);
        return;
      }

      operation.statut = CashbackStatut.VALIDEE;
      operation.validePar = data.validePar ?? '';
      operation.dateValidation = data.dateValidation ? new Date(data.dateValidation) : new Date();
      await this.operationCashbackRepository.save(operation);

      this.logger.debug(`Cashback operation validated: ${operation.id}`);
    } catch (error: any) {
      this.logger.error(`Failed to process cashback.validated: ${data.externalId}`, error.stack);
      throw error;
    }
  }

  async handleCashbackExpired(data: {
    externalId: string;
    expiredAt: string;
  }): Promise<void> {
    this.logger.log(`Processing wincash.cashback.expired: ${data.externalId}`);

    try {
      const operation = await this.operationCashbackRepository.findOne({
        where: { reference: data.externalId },
      });

      if (!operation) {
        this.logger.warn(`Cashback operation not found for expiration: ${data.externalId}`);
        return;
      }

      operation.statut = CashbackStatut.ANNULEE;
      await this.operationCashbackRepository.save(operation);

      this.logger.debug(`Cashback operation expired: ${operation.id}`);
    } catch (error: any) {
      this.logger.error(`Failed to process cashback.expired: ${data.externalId}`, error.stack);
      throw error;
    }
  }

  private mapCashbackType(type: string): CashbackType {
    switch (type.toLowerCase()) {
      case 'gain':
      case 'achat':
        return CashbackType.ACHAT;
      case 'parrainage':
        return CashbackType.PARRAINAGE;
      case 'fidelite':
        return CashbackType.FIDELITE;
      case 'bonus':
      case 'promotion':
        return CashbackType.PROMOTION;
      default:
        return CashbackType.AUTRE;
    }
  }
}
