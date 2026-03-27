import { WooCommerceConfigEntity } from '../entities/woocommerce-config.entity';

export interface IWooCommerceConfigRepository {
  findById(id: string): Promise<WooCommerceConfigEntity | null>;
  findByOrganisationId(keycloakGroupId: string): Promise<WooCommerceConfigEntity | null>;
  findByOrganisation(keycloakGroupId: string): Promise<WooCommerceConfigEntity | null>;
  findAllActive(): Promise<WooCommerceConfigEntity[]>;
  findAllByOrganisation(keycloakGroupId: string): Promise<WooCommerceConfigEntity[]>;
  save(entity: WooCommerceConfigEntity): Promise<WooCommerceConfigEntity>;
  delete(id: string): Promise<void>;
}
