import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WinLeadPlusSyncLogEntity,
  WinLeadPlusSyncStatus,
} from '../../../../../domain/winleadplus/entities/winleadplus-sync-log.entity';
import { IWinLeadPlusSyncLogRepository } from '../../../../../domain/winleadplus/repositories/IWinLeadPlusSyncLogRepository';

@Injectable()
export class WinLeadPlusSyncLogService implements IWinLeadPlusSyncLogRepository {
  private readonly logger = new Logger(WinLeadPlusSyncLogService.name);

  constructor(
    @InjectRepository(WinLeadPlusSyncLogEntity)
    private readonly repository: Repository<WinLeadPlusSyncLogEntity>,
  ) {}

  async findById(id: string): Promise<WinLeadPlusSyncLogEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findLatestByOrganisation(organisationId: string): Promise<WinLeadPlusSyncLogEntity | null> {
    return this.repository.findOne({
      where: { organisationId },
      order: { startedAt: 'DESC' },
    });
  }

  async findAll(filters?: {
    organisationId?: string;
    status?: WinLeadPlusSyncStatus;
  }): Promise<WinLeadPlusSyncLogEntity[]> {
    const where: Record<string, any> = {};
    if (filters?.organisationId) where.organisationId = filters.organisationId;
    if (filters?.status) where.status = filters.status;

    return this.repository.find({ where, order: { startedAt: 'DESC' } });
  }

  async findRunning(organisationId: string): Promise<WinLeadPlusSyncLogEntity | null> {
    return this.repository.findOne({
      where: { organisationId, status: WinLeadPlusSyncStatus.RUNNING },
    });
  }

  async save(entity: WinLeadPlusSyncLogEntity): Promise<WinLeadPlusSyncLogEntity> {
    return this.repository.save(entity);
  }

  async create(input: {
    organisationId: string;
    startedAt: Date;
  }): Promise<WinLeadPlusSyncLogEntity> {
    const entity = this.repository.create({
      organisationId: input.organisationId,
      startedAt: input.startedAt,
      status: WinLeadPlusSyncStatus.RUNNING,
    });
    return this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
