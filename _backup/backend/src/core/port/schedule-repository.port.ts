import { ScheduleEntity } from '../domain/schedule.entity';
import { BaseRepositoryPort } from './repository.port';

export interface ScheduleRepositoryPort extends BaseRepositoryPort<ScheduleEntity> {
  findByFactureId(factureId: string): Promise<ScheduleEntity[]>;
  findByContratId(contratId: string): Promise<ScheduleEntity[]>;
  findDueSchedules(date: Date): Promise<ScheduleEntity[]>;
  findFailedSchedulesForRetry(): Promise<ScheduleEntity[]>;
}
