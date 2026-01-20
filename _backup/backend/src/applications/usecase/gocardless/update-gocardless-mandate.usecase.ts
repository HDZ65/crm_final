import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  GoCardlessMandateEntity,
  GoCardlessMandateStatus,
} from '../../../core/domain/gocardless-mandate.entity';
import type { GoCardlessMandateRepositoryPort } from '../../../core/port/gocardless-mandate-repository.port';
import { UpdateGoCardlessMandateDto } from '../../dto/gocardless/update-gocardless-mandate.dto';

@Injectable()
export class UpdateGoCardlessMandateUseCase {
  constructor(
    @Inject('GoCardlessMandateRepositoryPort')
    private readonly repository: GoCardlessMandateRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateGoCardlessMandateDto,
  ): Promise<GoCardlessMandateEntity> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`GoCardless mandate with id ${id} not found`);
    }

    const updateData: Partial<GoCardlessMandateEntity> = {
      mandateStatus: dto.mandateStatus as GoCardlessMandateStatus | undefined,
      subscriptionId: dto.subscriptionId,
      subscriptionStatus: dto.subscriptionStatus,
      nextChargeDate: dto.nextChargeDate ? new Date(dto.nextChargeDate) : undefined,
      metadata: dto.metadata,
      updatedAt: new Date(),
    };

    return await this.repository.update(id, updateData);
  }

  async executeByMandateId(
    mandateId: string,
    dto: UpdateGoCardlessMandateDto,
  ): Promise<GoCardlessMandateEntity> {
    const existing = await this.repository.findByMandateId(mandateId);
    if (!existing) {
      throw new NotFoundException(
        `GoCardless mandate with mandateId ${mandateId} not found`,
      );
    }

    const updateData: Partial<GoCardlessMandateEntity> = {
      mandateStatus: dto.mandateStatus as GoCardlessMandateStatus | undefined,
      subscriptionId: dto.subscriptionId,
      subscriptionStatus: dto.subscriptionStatus,
      nextChargeDate: dto.nextChargeDate ? new Date(dto.nextChargeDate) : undefined,
      metadata: dto.metadata,
      updatedAt: new Date(),
    };

    return await this.repository.update(existing.id, updateData);
  }
}
