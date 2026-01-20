import { Injectable, Inject } from '@nestjs/common';
import { ScheduleEntity } from '../../../core/domain/schedule.entity';
import type { ScheduleRepositoryPort } from '../../../core/port/schedule-repository.port';
import { UpdateScheduleDto } from '../../dto/schedule/update-schedule.dto';

@Injectable()
export class UpdateScheduleUseCase {
  constructor(
    @Inject('ScheduleRepositoryPort')
    private readonly repository: ScheduleRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateScheduleDto): Promise<ScheduleEntity> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Schedule not found');
    }

    const updated = new ScheduleEntity({
      ...existing,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : existing.dueDate,
      amount: dto.amount ?? existing.amount,
      status: dto.status ?? existing.status,
      retryCount: dto.retryCount ?? existing.retryCount,
      lastFailureAt: dto.lastFailureAt
        ? new Date(dto.lastFailureAt)
        : existing.lastFailureAt,
      lastFailureReason: dto.lastFailureReason ?? existing.lastFailureReason,
      metadata: dto.metadata ?? existing.metadata,
      updatedAt: new Date(),
    });

    return await this.repository.update(id, updated);
  }
}
