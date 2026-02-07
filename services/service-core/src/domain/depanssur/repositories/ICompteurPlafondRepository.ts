import { CompteurPlafondEntity } from '../entities/compteur-plafond.entity';

export interface ICompteurPlafondRepository {
  findById(id: string): Promise<CompteurPlafondEntity | null>;
  findCurrentByAbonnementId(abonnementId: string): Promise<CompteurPlafondEntity | null>;
  findByAbonnementId(abonnementId: string): Promise<CompteurPlafondEntity[]>;
  save(entity: CompteurPlafondEntity): Promise<CompteurPlafondEntity>;
}
