import { MembreCompteEntity } from '../entities/membre-compte.entity';

export interface IMembreCompteRepository {
  findById(id: string): Promise<MembreCompteEntity | null>;
  findAll(): Promise<MembreCompteEntity[]>;
  save(entity: MembreCompteEntity): Promise<MembreCompteEntity>;
  delete(id: string): Promise<void>;
  findByOrganisationId(organisationId: string): Promise<MembreCompteEntity[]>;
  findByUtilisateurId(utilisateurId: string): Promise<MembreCompteEntity[]>;
}
