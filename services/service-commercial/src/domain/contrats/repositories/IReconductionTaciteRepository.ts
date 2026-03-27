import { ReconductionTaciteLogEntity } from '../entities/reconduction-tacite-log.entity';

export interface IReconductionTaciteRepository {
  findByContratId(contratId: string): Promise<ReconductionTaciteLogEntity | null>;
  findContratsDueForJ90(date: Date): Promise<ReconductionTaciteLogEntity[]>;
  findContratsDueForJ30(date: Date): Promise<ReconductionTaciteLogEntity[]>;
  markJ90Sent(contratId: string): Promise<void>;
  markJ30Sent(contratId: string): Promise<void>;
  markRenewed(contratId: string): Promise<void>;
  markCancelled(contratId: string, reason: string): Promise<void>;
  create(data: Partial<ReconductionTaciteLogEntity>): Promise<ReconductionTaciteLogEntity>;
}
