import { Injectable, Inject } from '@nestjs/common';
import { GoCardlessMandateEntity } from '../../../core/domain/gocardless-mandate.entity';
import type { GoCardlessMandateRepositoryPort } from '../../../core/port/gocardless-mandate-repository.port';
import { CreateGoCardlessMandateDto } from '../../dto/gocardless/create-gocardless-mandate.dto';

@Injectable()
export class CreateGoCardlessMandateUseCase {
  constructor(
    @Inject('GoCardlessMandateRepositoryPort')
    private readonly repository: GoCardlessMandateRepositoryPort,
  ) {}

  async execute(dto: CreateGoCardlessMandateDto): Promise<GoCardlessMandateEntity> {
    const entity = new GoCardlessMandateEntity({
      clientId: dto.clientId,
      gocardlessCustomerId: dto.gocardlessCustomerId,
      gocardlessBankAccountId: dto.gocardlessBankAccountId,
      mandateId: dto.mandateId,
      mandateReference: dto.mandateReference,
      mandateStatus: dto.mandateStatus as any,
      scheme: dto.scheme as any,
      subscriptionId: dto.subscriptionId,
      subscriptionStatus: dto.subscriptionStatus,
      nextChargeDate: dto.nextChargeDate ? new Date(dto.nextChargeDate) : undefined,
      metadata: dto.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(entity);
  }
}
