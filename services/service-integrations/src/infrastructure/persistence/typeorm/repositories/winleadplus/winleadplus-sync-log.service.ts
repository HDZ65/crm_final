import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WinLeadPlusSyncLogEntity,
  WinLeadPlusSyncStatus,
} from '../../../../../domain/winleadplus/entities/winleadplus-sync-log.entity';
import { IWinLeadPlusSyncLogRepository } from '../../../../../domain/winleadplus/repositories/IWinLeadPlusSyncLogRepository';

@Injectable()
export class WinLeadPlusSyncLogService implements IWinLeadPlusSyncLogRepository {
  constructor(
    @InjectRepository(WinLeadPlusSyncLogEntity)
    private readonly repository: Repository<WinLeadPlusSyncLogEntity>,
  ) {}

  async findById(id: string): Promise<WinLeadPlusSyncLogEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findLatestByOrganisation(keycloakGroupId: string): Promise<WinLeadPlusSyncLogEntity | null> {
    return this.repository.findOne({
      where: { keycloakGroupId },
      order: { startedAt: 'DESC' },
    });
  }

  async findAll(filters?: {
    keycloakGroupId?: string;
    status?: WinLeadPlusSyncStatus;
  }): Promise<WinLeadPlusSyncLogEntity[]> {
    const where: Record<string, any> = {};
    if (filters?.keycloakGroupId) where.keycloakGroupId = filters.keycloakGroupId;
    if (filters?.status) where.status = filters.status;

    return this.repository.find({ where, order: { startedAt: 'DESC' } });
  }

  async findRunning(keycloakGroupId: string): Promise<WinLeadPlusSyncLogEntity | null> {
    return this.repository.findOne({
      where: { keycloakGroupId, status: WinLeadPlusSyncStatus.RUNNING },
    });
  }

  async save(entity: WinLeadPlusSyncLogEntity): Promise<WinLeadPlusSyncLogEntity> {
    return this.repository.save(entity);
  }

  async create(input: { keycloakGroupId: string; startedAt: Date }): Promise<WinLeadPlusSyncLogEntity> {
    const entity = this.repository.create({
      keycloakGroupId: input.keycloakGroupId,
      startedAt: input.startedAt,
      status: WinLeadPlusSyncStatus.RUNNING,
    });
    return this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
