import { ClientExternalMappingEntity, SourceSystem } from '../entities/client-external-mapping.entity';

export interface IClientExternalMappingRepository {
  findById(id: string): Promise<ClientExternalMappingEntity | null>;
  findByImsUserId(organisationId: string, imsUserId: string): Promise<ClientExternalMappingEntity | null>;
  findByClientId(organisationId: string, clientId: string): Promise<ClientExternalMappingEntity[]>;
  findByStoreCustomerId(organisationId: string, storeCustomerId: string): Promise<ClientExternalMappingEntity | null>;
  findBySourceSystem(organisationId: string, sourceSystem: SourceSystem): Promise<ClientExternalMappingEntity[]>;
  save(entity: ClientExternalMappingEntity): Promise<ClientExternalMappingEntity>;
  delete(id: string): Promise<boolean>;
  findAll(filters?: {
    organisationId?: string;
    clientId?: string;
    sourceSystem?: SourceSystem;
    sourceChannel?: string;
  }): Promise<ClientExternalMappingEntity[]>;
}
