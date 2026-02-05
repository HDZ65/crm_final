import { ScheduleEntity } from '../entities/schedule.entity';

export interface IScheduleRepository {
  findById(id: string): Promise<ScheduleEntity | null>;
  findByClient(clientId: string): Promise<ScheduleEntity[]>;
  findBySociete(societeId: string): Promise<ScheduleEntity[]>;
  findByContrat(contratId: string): Promise<ScheduleEntity[]>;
  findActiveByClient(clientId: string): Promise<ScheduleEntity[]>;
  save(entity: ScheduleEntity): Promise<ScheduleEntity>;
  delete(id: string): Promise<void>;
}
