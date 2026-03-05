import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import {
  PROVISIONING_STATE_EN_ATTENTE_RETRACTATION,
  ProvisioningLifecycleEntity,
} from '../../../../../domain/provisioning/entities';
import type { IProvisioningLifecycleRepository } from '../../../../../domain/provisioning/repositories/IProvisioningLifecycleRepository';

@Injectable()
export class ProvisioningLifecycleService
  implements IProvisioningLifecycleRepository
{
  constructor(
    @InjectRepository(ProvisioningLifecycleEntity)
    private readonly repository: Repository<ProvisioningLifecycleEntity>,
  ) {}

  async findByContratId(
    contratId: string,
  ): Promise<ProvisioningLifecycleEntity | null> {
    return this.repository.findOne({
      where: { contratId },
    });
  }

  async findReadyForRetractionDeadline(
    now: Date,
    limit = 200,
  ): Promise<ProvisioningLifecycleEntity[]> {
    return this.repository.find({
      where: {
        provisioningState: PROVISIONING_STATE_EN_ATTENTE_RETRACTATION,
        dateFinRetractation: LessThanOrEqual(now),
      },
      order: {
        dateFinRetractation: 'ASC',
      },
      take: limit,
    });
  }

  async save(
    entity: ProvisioningLifecycleEntity,
  ): Promise<ProvisioningLifecycleEntity> {
    return this.repository.save(entity);
  }

  async findByOrganisationId(
    orgId: string,
    options: { stateFilter?: string; search?: string; page: number; limit: number },
  ): Promise<{ items: ProvisioningLifecycleEntity[]; total: number }> {
    const { stateFilter, search, page, limit } = options;
    const qb = this.repository
      .createQueryBuilder('lifecycle')
      .where('lifecycle.organisationId = :orgId', { orgId });

    if (stateFilter) {
      qb.andWhere('lifecycle.provisioningState = :stateFilter', { stateFilter });
    }

    if (search) {
      qb.andWhere(
        '(lifecycle.contratId ILIKE :search OR lifecycle.clientId ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async countByState(orgId: string): Promise<Record<string, number>> {
    const results = await this.repository
      .createQueryBuilder('lifecycle')
      .select('lifecycle.provisioning_state', 'state')
      .addSelect('COUNT(*)', 'count')
      .where('lifecycle.organisationId = :orgId', { orgId })
      .groupBy('lifecycle.provisioning_state')
      .getRawMany();

    return results.reduce(
      (acc: Record<string, number>, row: { state: string; count: string }) => {
        acc[row.state] = parseInt(row.count, 10);
        return acc;
      },
      {},
    );
  }

  async findById(id: string): Promise<ProvisioningLifecycleEntity | null> {
    return this.repository.findOne({ where: { id } });
  }
}
