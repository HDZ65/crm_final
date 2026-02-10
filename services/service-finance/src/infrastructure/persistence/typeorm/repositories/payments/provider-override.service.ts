import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  OverrideScope,
  ProviderOverrideEntity,
  ScheduleEntity,
} from '../../../../../domain/payments/entities';

export interface CreateProviderOverrideParams {
  companyId?: string;
  scope: OverrideScope;
  scopeId: string;
  providerAccountId: string;
  reason?: string | null;
  createdBy?: string | null;
}

@Injectable()
export class ProviderOverrideService {
  private readonly logger = new Logger(ProviderOverrideService.name);

  constructor(
    @InjectRepository(ProviderOverrideEntity)
    private readonly overrideRepository: Repository<ProviderOverrideEntity>,
    @InjectRepository(ScheduleEntity)
    private readonly scheduleRepository: Repository<ScheduleEntity>,
  ) {}

  async getOverride(
    scope: OverrideScope,
    scopeId: string,
  ): Promise<ProviderOverrideEntity | null> {
    return this.overrideRepository.findOne({
      where: {
        scope,
        scopeId,
      },
    });
  }

  async createOverride(
    params: CreateProviderOverrideParams,
  ): Promise<ProviderOverrideEntity> {
    if (params.companyId) {
      await this.ensureScopeBelongsToCompany(
        params.companyId,
        params.scope,
        params.scopeId,
      );
    }

    const existing = await this.getOverride(params.scope, params.scopeId);
    const normalizedReason = params.reason?.trim() || null;

    if (existing) {
      existing.providerAccountId = params.providerAccountId;
      existing.reason = normalizedReason;
      existing.createdBy = params.createdBy ?? existing.createdBy;
      return this.overrideRepository.save(existing);
    }

    const override = this.overrideRepository.create({
      scope: params.scope,
      scopeId: params.scopeId,
      providerAccountId: params.providerAccountId,
      reason: normalizedReason,
      createdBy: params.createdBy ?? null,
    });

    return this.overrideRepository.save(override);
  }

  async deleteOverride(overrideId: string): Promise<void> {
    const result = await this.overrideRepository.delete({ id: overrideId });

    if (!result.affected) {
      throw new NotFoundException(`Provider override ${overrideId} not found`);
    }
  }

  async listOverrides(companyId: string): Promise<ProviderOverrideEntity[]> {
    const overrides = await this.overrideRepository.find({
      order: { createdAt: 'DESC' },
    });

    if (!companyId) {
      return overrides;
    }

    const [clientRows, contractRows] = await Promise.all([
      this.scheduleRepository
        .createQueryBuilder('schedule')
        .select('DISTINCT schedule.clientId', 'value')
        .where('schedule.societeId = :companyId', { companyId })
        .andWhere('schedule.clientId IS NOT NULL')
        .getRawMany<{ value: string }>(),
      this.scheduleRepository
        .createQueryBuilder('schedule')
        .select('DISTINCT schedule.contratId', 'value')
        .where('schedule.societeId = :companyId', { companyId })
        .andWhere('schedule.contratId IS NOT NULL')
        .getRawMany<{ value: string }>(),
    ]);

    const clientIds = new Set(clientRows.map((row) => row.value).filter(Boolean));
    const contractIds = new Set(
      contractRows.map((row) => row.value).filter(Boolean),
    );

    return overrides.filter((override) => {
      if (override.scope === OverrideScope.CLIENT) {
        return clientIds.has(override.scopeId);
      }

      if (override.scope === OverrideScope.CONTRAT) {
        return contractIds.has(override.scopeId);
      }

      return false;
    });
  }

  private async ensureScopeBelongsToCompany(
    companyId: string,
    scope: OverrideScope,
    scopeId: string,
  ): Promise<void> {
    const where =
      scope === OverrideScope.CLIENT
        ? { societeId: companyId, clientId: scopeId }
        : { societeId: companyId, contratId: scopeId };

    const exists = await this.scheduleRepository.exist({ where });
    if (!exists) {
      this.logger.warn(
        `Override ${scope}:${scopeId} has no schedule linkage for company ${companyId}`,
      );
    }
  }
}
