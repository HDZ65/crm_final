import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CfastEntityMappingEntity } from '../../../../../domain/cfast/entities/cfast-entity-mapping.entity';
import { ICfastEntityMappingRepository } from '../../../../../domain/cfast/repositories/ICfastEntityMappingRepository';

@Injectable()
export class CfastEntityMappingService implements ICfastEntityMappingRepository {
  private readonly logger = new Logger(CfastEntityMappingService.name);

  constructor(
    @InjectRepository(CfastEntityMappingEntity)
    private readonly repository: Repository<CfastEntityMappingEntity>,
  ) {}

  async findMapping(
    orgId: string,
    crmType: string,
    crmId: string,
    cfastType: string,
  ): Promise<CfastEntityMappingEntity | null> {
    return this.repository.findOne({
      where: {
        organisationId: orgId,
        crmEntityType: crmType,
        crmEntityId: crmId,
        cfastEntityType: cfastType,
      },
    });
  }

  async createMapping(data: {
    organisationId: string;
    crmEntityType: string;
    crmEntityId: string;
    cfastEntityType: string;
    cfastEntityId: string;
    metadata?: Record<string, unknown>;
  }): Promise<CfastEntityMappingEntity> {
    const entity = this.repository.create({
      organisationId: data.organisationId,
      crmEntityType: data.crmEntityType,
      crmEntityId: data.crmEntityId,
      cfastEntityType: data.cfastEntityType,
      cfastEntityId: data.cfastEntityId,
      metadata: data.metadata ?? {},
    });
    return this.repository.save(entity);
  }

  async findByCrmEntity(
    orgId: string,
    crmType: string,
    crmId: string,
  ): Promise<CfastEntityMappingEntity[]> {
    return this.repository.find({
      where: {
        organisationId: orgId,
        crmEntityType: crmType,
        crmEntityId: crmId,
      },
    });
  }

  async findAllByOrg(orgId: string): Promise<CfastEntityMappingEntity[]> {
    return this.repository.find({
      where: { organisationId: orgId },
    });
  }

  async upsertMapping(data: {
    organisationId: string;
    crmEntityType: string;
    crmEntityId: string;
    cfastEntityType: string;
    cfastEntityId: string;
    metadata?: Record<string, unknown>;
  }): Promise<CfastEntityMappingEntity> {
    const existing = await this.findMapping(
      data.organisationId,
      data.crmEntityType,
      data.crmEntityId,
      data.cfastEntityType,
    );

    if (existing) {
      existing.cfastEntityId = data.cfastEntityId;
      existing.metadata = data.metadata ?? existing.metadata;
      return this.repository.save(existing);
    }

    return this.createMapping(data);
  }
}
