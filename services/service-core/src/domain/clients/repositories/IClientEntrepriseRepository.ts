import { ClientEntrepriseEntity } from '../entities/client-entreprise.entity';

export interface IClientEntrepriseRepository {
  findById(id: string): Promise<ClientEntrepriseEntity | null>;
  findAll(): Promise<ClientEntrepriseEntity[]>;
  save(entity: ClientEntrepriseEntity): Promise<ClientEntrepriseEntity>;
  delete(id: string): Promise<void>;
  findBySiren(siren: string): Promise<ClientEntrepriseEntity | null>;
}
