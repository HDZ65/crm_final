import { WooCommerceConfigEntity } from '../entities/woocommerce-config.entity';

export interface IWooCommerceConfigRepository {
  findById(id: string): Promise<WooCommerceConfigEntity | null>;
  findByOrganisationId(organisationId: string): Promise<WooCommerceConfigEntity | null>;
  findByOrganisation(organisationId: string): Promise<WooCommerceConfigEntity | null>;
  findAllActive(): Promise<WooCommerceConfigEntity[]>;
  save(entity: WooCommerceConfigEntity): Promise<WooCommerceConfigEntity>;
  delete(id: string): Promise<void>;
}
