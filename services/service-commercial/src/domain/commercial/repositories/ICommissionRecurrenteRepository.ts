import { CommissionRecurrenteEntity } from '../entities/commission-recurrente.entity';

export interface ICommissionRecurrenteRepository {
  findById(id: string): Promise<CommissionRecurrenteEntity | null>;
  findAll(filters?: {
    organisationId?: string;
    apporteurId?: string;
    contratId?: string;
    periode?: string;
    statutRecurrence?: string;
  }): Promise<CommissionRecurrenteEntity[]>;
  save(entity: CommissionRecurrenteEntity): Promise<CommissionRecurrenteEntity>;
  delete(id: string): Promise<void>;
}
