import { MembrePartenaireEntity } from '../entities/membre-partenaire.entity';

export interface IMembrePartenaireRepository {
  findById(id: string): Promise<MembrePartenaireEntity | null>;
  findAll(): Promise<MembrePartenaireEntity[]>;
  save(entity: MembrePartenaireEntity): Promise<MembrePartenaireEntity>;
  delete(id: string): Promise<void>;
  findByPartenaireId(partenaireId: string): Promise<MembrePartenaireEntity[]>;
  findByUtilisateurId(utilisateurId: string): Promise<MembrePartenaireEntity[]>;
}
