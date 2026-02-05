import { ApporteurEntity } from '../entities/apporteur.entity';

export interface IApporteurRepository {
  findById(id: string): Promise<ApporteurEntity | null>;
  findAll(organisationId: string): Promise<ApporteurEntity[]>;
  findByOrganisation(organisationId: string): Promise<ApporteurEntity[]>;
  save(entity: ApporteurEntity): Promise<ApporteurEntity>;
  delete(id: string): Promise<void>;
}
