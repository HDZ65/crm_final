import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { ScheduleEntity } from '../../../core/domain/schedule.entity';
import { ScheduleStatus } from '../../../core/domain/payment.enums';
import type { ScheduleRepositoryPort } from '../../../core/port/schedule-repository.port';
import type { ContratRepositoryPort } from '../../../core/port/contrat-repository.port';
import { RenewScheduleDto } from '../../dto/schedule/renew-schedule.dto';

// Code du statut "Actif" pour les contrats
const STATUT_CONTRAT_ACTIF_CODE = 'ACTIF';

@Injectable()
export class RenewScheduleUseCase {
  constructor(
    @Inject('ScheduleRepositoryPort')
    private readonly scheduleRepository: ScheduleRepositoryPort,
    @Inject('ContratRepositoryPort')
    private readonly contratRepository: ContratRepositoryPort,
  ) {}

  async execute(id: string, dto: RenewScheduleDto): Promise<ScheduleEntity> {
    // 1. Find the schedule
    const existing = await this.scheduleRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Schedule not found');
    }

    // 2. Verify it's in EXPIRED status (or allow renewal from other statuses?)
    if (existing.status !== ScheduleStatus.EXPIRED) {
      throw new BadRequestException(
        `Cannot renew schedule with status "${existing.status}". Only EXPIRED schedules can be renewed.`,
      );
    }

    // 3. Create renewed schedule entity
    const renewed = new ScheduleEntity({
      ...existing,
      // Keep original amount for reference
      originalAmount: existing.originalAmount ?? existing.amount,
      // Set new amount
      amount: dto.newAmount,
      // Lock price at renewal date
      priceLockedAt: new Date(),
      // New contract period
      contractStartDate: new Date(),
      contractEndDate: dto.newContractEndDate ? new Date(dto.newContractEndDate) : null,
      // Reset scheduling
      dueDate: dto.newDueDate ? new Date(dto.newDueDate) : new Date(),
      nextDueDate: null,
      // Reset status and retry counters
      status: ScheduleStatus.PLANNED,
      retryCount: 0,
      lastFailureAt: null,
      lastFailureReason: null,
      // Update timestamp
      updatedAt: new Date(),
    });

    // 4. Save the renewed schedule
    const saved = await this.scheduleRepository.update(id, renewed);

    // 5. Also update the associated Contrat status to "Actif"
    if (existing.contratId) {
      const contrat = await this.contratRepository.findById(existing.contratId);
      if (contrat) {
        await this.contratRepository.update(existing.contratId, {
          ...contrat,
          statut: STATUT_CONTRAT_ACTIF_CODE,
          updatedAt: new Date(),
        });
      }
    }

    return saved;
  }
}
