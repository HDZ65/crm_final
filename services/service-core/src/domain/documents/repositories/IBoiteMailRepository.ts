import { BoiteMailEntity } from '../entities/boite-mail.entity';

export interface IBoiteMailRepository {
  findById(id: string): Promise<BoiteMailEntity | null>;
  findAll(): Promise<BoiteMailEntity[]>;
  save(entity: BoiteMailEntity): Promise<BoiteMailEntity>;
  delete(id: string): Promise<void>;
  findByUtilisateurId(utilisateurId: string): Promise<BoiteMailEntity[]>;
  findDefaultByUtilisateurId(utilisateurId: string): Promise<BoiteMailEntity | null>;
}
