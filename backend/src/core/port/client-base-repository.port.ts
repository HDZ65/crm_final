import { ClientBaseEntity } from '../domain/client-base.entity';
import { BaseRepositoryPort } from './repository.port';

export interface ClientBaseRepositoryPort
  extends BaseRepositoryPort<ClientBaseEntity> {
  findByPhoneAndName(
    telephone: string,
    nom: string,
  ): Promise<ClientBaseEntity | null>;
}
