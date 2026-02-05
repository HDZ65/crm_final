import { SocieteEntity } from '../entities/societe.entity';

export interface ISocieteRepository {
  findById(id: string): Promise<SocieteEntity | null>;
  findAll(): Promise<SocieteEntity[]>;
  save(entity: SocieteEntity): Promise<SocieteEntity>;
  delete(id: string): Promise<void>;
  findByOrganisationId(organisationId: string): Promise<SocieteEntity[]>;
  findBySiren(siren: string): Promise<SocieteEntity | null>;
}
