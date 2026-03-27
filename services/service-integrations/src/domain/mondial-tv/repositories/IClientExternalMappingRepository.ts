import { ClientExternalMappingEntity, SourceSystem } from '../entities/client-external-mapping.entity';

export interface IClientExternalMappingRepository {
  findById(id: string): Promise<ClientExternalMappingEntity | null>;
  findByImsUserId(keycloakGroupId: string, imsUserId: string): Promise<ClientExternalMappingEntity | null>;
  findByClientId(keycloakGroupId: string, clientId: string): Promise<ClientExternalMappingEntity[]>;
  findByStoreCustomerId(keycloakGroupId: string, storeCustomerId: string): Promise<ClientExternalMappingEntity | null>;
  findBySourceSystem(keycloakGroupId: string, sourceSystem: SourceSystem): Promise<ClientExternalMappingEntity[]>;
  save(entity: ClientExternalMappingEntity): Promise<ClientExternalMappingEntity>;
  delete(id: string): Promise<boolean>;
  findAll(filters?: {
    keycloakGroupId?: string;
    clientId?: string;
    sourceSystem?: SourceSystem;
    sourceChannel?: string;
  }): Promise<ClientExternalMappingEntity[]>;
}
