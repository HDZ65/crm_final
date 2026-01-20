import { Injectable, Inject } from '@nestjs/common';
import { ScheduleEntity } from '../../../core/domain/schedule.entity';
import type { ScheduleRepositoryPort } from '../../../core/port/schedule-repository.port';

@Injectable()
export class GetScheduleUseCase {
  constructor(
    @Inject('ScheduleRepositoryPort')
    private readonly repository: ScheduleRepositoryPort,
  ) {}

  async execute(id: string): Promise<ScheduleEntity | null> {
    return await this.repository.findById(id);
  }

  async findAll(): Promise<ScheduleEntity[]> {
    return await this.repository.findAll();
  }

  async findByFactureId(factureId: string): Promise<ScheduleEntity[]> {
    return await this.repository.findByFactureId(factureId);
  }

  async findByContratId(contratId: string): Promise<ScheduleEntity[]> {
    return await this.repository.findByContratId(contratId);
  }

  async findDueSchedules(date: Date): Promise<ScheduleEntity[]> {
    return await this.repository.findDueSchedules(date);
  }
}
