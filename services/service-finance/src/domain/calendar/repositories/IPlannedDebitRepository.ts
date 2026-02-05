import { PlannedDebitEntity } from '../entities/planned-debit.entity';

export interface IPlannedDebitRepository {
  findById(id: string): Promise<PlannedDebitEntity | null>;
  findByOrganisationAndDate(organisationId: string, date: Date): Promise<PlannedDebitEntity[]>;
  findByClient(clientId: string): Promise<PlannedDebitEntity[]>;
  findByContrat(contratId: string): Promise<PlannedDebitEntity[]>;
  findPendingByDate(organisationId: string, date: Date): Promise<PlannedDebitEntity[]>;
  save(entity: PlannedDebitEntity): Promise<PlannedDebitEntity>;
  delete(id: string): Promise<void>;
}
