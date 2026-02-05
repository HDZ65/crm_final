import { FactureEntity } from '../entities/facture.entity';

export interface IFactureRepository {
  findById(id: string): Promise<FactureEntity | null>;
  findByOrganisation(organisationId: string): Promise<FactureEntity[]>;
  findByClient(clientId: string): Promise<FactureEntity[]>;
  findByContrat(contratId: string): Promise<FactureEntity[]>;
  save(entity: FactureEntity): Promise<FactureEntity>;
  delete(id: string): Promise<void>;
}
