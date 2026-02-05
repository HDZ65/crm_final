import { TransporteurCompteEntity } from '../entities/transporteur-compte.entity';

export interface ITransporteurCompteRepository {
  findById(id: string): Promise<TransporteurCompteEntity | null>;
  findAll(): Promise<TransporteurCompteEntity[]>;
  save(entity: TransporteurCompteEntity): Promise<TransporteurCompteEntity>;
  delete(id: string): Promise<void>;
  findByOrganisationId(organisationId: string): Promise<TransporteurCompteEntity[]>;
}
