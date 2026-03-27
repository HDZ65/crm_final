import { StoreConfigEntity, StoreType } from '../entities/store-config.entity';

export interface IStoreConfigRepository {
  findById(id: string): Promise<StoreConfigEntity | null>;
  findByOrganisationAndType(organisationId: string, storeType: StoreType): Promise<StoreConfigEntity | null>;
  findByOrganisation(organisationId: string): Promise<StoreConfigEntity[]>;
  findActiveByOrganisation(organisationId: string): Promise<StoreConfigEntity[]>;
  save(entity: StoreConfigEntity): Promise<StoreConfigEntity>;
  delete(id: string): Promise<boolean>;
  findAll(filters?: {
    organisationId?: string;
    storeType?: StoreType;
    active?: boolean;
  }): Promise<StoreConfigEntity[]>;
}
