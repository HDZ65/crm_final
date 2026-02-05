import { ConditionPaiementEntity } from '../entities/condition-paiement.entity';

export interface IConditionPaiementRepository {
  findById(id: string): Promise<ConditionPaiementEntity | null>;
  findAll(): Promise<ConditionPaiementEntity[]>;
  save(entity: ConditionPaiementEntity): Promise<ConditionPaiementEntity>;
  delete(id: string): Promise<void>;
  findByCode(code: string): Promise<ConditionPaiementEntity | null>;
}
