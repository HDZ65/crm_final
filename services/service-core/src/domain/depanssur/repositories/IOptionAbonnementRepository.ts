import { OptionAbonnementEntity } from '../entities/option-abonnement.entity';

export interface IOptionAbonnementRepository {
  findById(id: string): Promise<OptionAbonnementEntity | null>;
  findByAbonnementId(abonnementId: string, actif?: boolean): Promise<OptionAbonnementEntity[]>;
  save(entity: OptionAbonnementEntity): Promise<OptionAbonnementEntity>;
  delete(id: string): Promise<void>;
}
