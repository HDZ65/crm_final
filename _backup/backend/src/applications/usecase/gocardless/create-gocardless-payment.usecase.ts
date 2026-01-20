import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { GoCardlessService } from '../../../infrastructure/services/gocardless.service';
import {
  CreateGoCardlessPaymentDto,
  GoCardlessPaymentResponseDto,
} from '../../dto/gocardless/create-payment.dto';
import { GetGoCardlessMandateUseCase } from './get-gocardless-mandate.usecase';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CreateGoCardlessPaymentUseCase {
  private readonly logger = new Logger(CreateGoCardlessPaymentUseCase.name);

  constructor(
    private readonly gocardlessService: GoCardlessService,
    private readonly getMandateUseCase: GetGoCardlessMandateUseCase,
  ) {}

  async execute(dto: CreateGoCardlessPaymentDto): Promise<GoCardlessPaymentResponseDto> {
    // Verify mandate exists and is active
    const mandateRecord = await this.getMandateUseCase.executeByMandateId(dto.mandateId);
    if (!mandateRecord) {
      throw new NotFoundException(`Mandate ${dto.mandateId} not found in database`);
    }

    if (!mandateRecord.isActive()) {
      throw new Error(`Mandate ${dto.mandateId} is not active (status: ${mandateRecord.mandateStatus})`);
    }

    this.logger.log(`Creating payment of ${dto.amount} ${dto.currency || 'EUR'} for mandate ${dto.mandateId}`);

    const payment = await this.gocardlessService.createPayment(
      dto.mandateId,
      dto.amount,
      dto.currency || 'EUR',
      {
        reference: dto.reference,
        description: dto.description,
        metadata: dto.metadata,
        idempotencyKey: uuidv4(),
      },
    );

    return new GoCardlessPaymentResponseDto(payment);
  }

  async executeByClientId(
    clientId: string,
    amount: number,
    currency: string = 'EUR',
    options?: {
      reference?: string;
      description?: string;
      metadata?: Record<string, string>;
    },
  ): Promise<GoCardlessPaymentResponseDto> {
    // Find active mandate for client
    const mandateRecord = await this.getMandateUseCase.executeActiveByClientId(clientId);
    if (!mandateRecord) {
      throw new NotFoundException(`No active mandate found for client ${clientId}`);
    }

    return this.execute({
      mandateId: mandateRecord.mandateId,
      amount,
      currency,
      reference: options?.reference,
      description: options?.description,
      metadata: options?.metadata,
    });
  }
}
