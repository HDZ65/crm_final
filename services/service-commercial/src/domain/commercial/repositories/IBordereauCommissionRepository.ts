import { BordereauCommissionEntity } from '../entities/bordereau-commission.entity';

export interface IBordereauCommissionRepository {
  findById(id: string): Promise<BordereauCommissionEntity | null>;
  findByReference(reference: string): Promise<BordereauCommissionEntity | null>;
  findAll(filters?: {
    organisationId?: string;
    apporteurId?: string;
    periode?: string;
    statutBordereau?: string;
  }): Promise<BordereauCommissionEntity[]>;
  findWithLignes(id: string): Promise<BordereauCommissionEntity | null>;
  save(entity: BordereauCommissionEntity): Promise<BordereauCommissionEntity>;
  delete(id: string): Promise<void>;
}
