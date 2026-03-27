import { WooCommerceEntityType, WooCommerceMappingEntity } from '../entities/woocommerce-mapping.entity';

export interface IWooCommerceMappingRepository {
  findById(id: string): Promise<WooCommerceMappingEntity | null>;
  findByWooId(
    keycloakGroupId: string,
    entityType: WooCommerceEntityType,
    wooId: string,
  ): Promise<WooCommerceMappingEntity | null>;
  findByCrmEntityId(crmEntityId: string): Promise<WooCommerceMappingEntity[]>;
  findAll(filters?: {
    keycloakGroupId?: string;
    entityType?: WooCommerceEntityType;
  }): Promise<WooCommerceMappingEntity[]>;
  save(entity: WooCommerceMappingEntity): Promise<WooCommerceMappingEntity>;
  findByConfigId(configId: string, entityType: WooCommerceEntityType): Promise<WooCommerceMappingEntity[]>;
  deleteByConfigId(configId: string, entityType: WooCommerceEntityType): Promise<void>;
  delete(id: string): Promise<void>;
}
