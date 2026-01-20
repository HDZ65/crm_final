import { Injectable, Inject } from '@nestjs/common';
import { ScheduleEntity } from '../../../core/domain/schedule.entity';
import type { ScheduleRepositoryPort } from '../../../core/port/schedule-repository.port';
import { CreateScheduleDto } from '../../dto/schedule/create-schedule.dto';
import { ScheduleStatus } from '../../../core/domain/payment.enums';

@Injectable()
export class CreateScheduleUseCase {
  constructor(
    @Inject('ScheduleRepositoryPort')
    private readonly repository: ScheduleRepositoryPort,
  ) {}

  async execute(dto: CreateScheduleDto): Promise<ScheduleEntity> {
    const entity = new ScheduleEntity({
      organisationId: dto.organisationId,
      factureId: dto.factureId,
      contratId: dto.contratId,
      societeId: dto.societeId,
      clientId: dto.clientId,
      produitId: dto.produitId,
      pspName: dto.pspName,
      amount: dto.amount,
      currency: dto.currency ?? 'EUR',
      dueDate: new Date(dto.dueDate),
      isRecurring: dto.isRecurring ?? false,
      intervalUnit: dto.intervalUnit ?? null,
      intervalCount: dto.intervalCount ?? null,
      status: dto.status ?? ScheduleStatus.PLANNED,
      retryCount: 0,
      maxRetries: dto.maxRetries ?? 3,
      pspMandateId: dto.pspMandateId ?? null,
      pspCustomerId: dto.pspCustomerId ?? null,
      metadata: dto.metadata ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(entity);
  }
}
