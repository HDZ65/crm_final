import { StoreConfigEntity, StoreType } from '../entities/store-config.entity';

export interface IStoreConfigRepository {
  findById(id: string): Promise<StoreConfigEntity | null>;
  findByOrganisationAndType(keycloakGroupId: string, storeType: StoreType): Promise<StoreConfigEntity | null>;
  findByOrganisation(keycloakGroupId: string): Promise<StoreConfigEntity[]>;
  findActiveByOrganisation(keycloakGroupId: string): Promise<StoreConfigEntity[]>;
  save(entity: StoreConfigEntity): Promise<StoreConfigEntity>;
  delete(id: string): Promise<boolean>;
  findAll(filters?: {
    keycloakGroupId?: string;
    storeType?: StoreType;
    active?: boolean;
  }): Promise<StoreConfigEntity[]>;
}
