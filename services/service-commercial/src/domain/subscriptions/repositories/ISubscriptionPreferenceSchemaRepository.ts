import { SubscriptionPreferenceSchemaEntity } from '../entities/subscription-preference-schema.entity';

export interface ISubscriptionPreferenceSchemaRepository {
  findById(id: string): Promise<SubscriptionPreferenceSchemaEntity | null>;
  findByOrganisation(organisationId: string): Promise<SubscriptionPreferenceSchemaEntity[]>;
  findByOrganisationAndCode(
    organisationId: string,
    code: string,
  ): Promise<SubscriptionPreferenceSchemaEntity | null>;
  save(entity: SubscriptionPreferenceSchemaEntity): Promise<SubscriptionPreferenceSchemaEntity>;
  delete(id: string): Promise<void>;
}
