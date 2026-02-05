import { CommissionEntity } from '../entities/commission.entity';

export interface ICommissionRepository {
  findById(id: string): Promise<CommissionEntity | null>;
  findByReference(reference: string): Promise<CommissionEntity | null>;
  findAll(filters?: {
    organisationId?: string;
    apporteurId?: string;
    contratId?: string;
    periode?: string;
    statutId?: string;
  }): Promise<CommissionEntity[]>;
  save(entity: CommissionEntity): Promise<CommissionEntity>;
  delete(id: string): Promise<void>;
}
