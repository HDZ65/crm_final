import { CfastEntityMappingEntity } from '../entities/cfast-entity-mapping.entity';

export interface ICfastEntityMappingRepository {
  findMapping(
    orgId: string,
    crmType: string,
    crmId: string,
    cfastType: string,
  ): Promise<CfastEntityMappingEntity | null>;

  createMapping(data: {
    organisationId: string;
    crmEntityType: string;
    crmEntityId: string;
    cfastEntityType: string;
    cfastEntityId: string;
    metadata?: Record<string, unknown>;
  }): Promise<CfastEntityMappingEntity>;

  findByCrmEntity(
    orgId: string,
    crmType: string,
    crmId: string,
  ): Promise<CfastEntityMappingEntity[]>;

  findAllByOrg(orgId: string): Promise<CfastEntityMappingEntity[]>;

  upsertMapping(data: {
    organisationId: string;
    crmEntityType: string;
    crmEntityId: string;
    cfastEntityType: string;
    cfastEntityId: string;
    metadata?: Record<string, unknown>;
  }): Promise<CfastEntityMappingEntity>;
}
