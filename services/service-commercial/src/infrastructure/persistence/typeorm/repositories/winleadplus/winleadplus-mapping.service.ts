import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WinLeadPlusMappingEntity } from '../../../../../domain/winleadplus/entities/winleadplus-mapping.entity';
import { IWinLeadPlusMappingRepository } from '../../../../../domain/winleadplus/repositories/IWinLeadPlusMappingRepository';

@Injectable()
export class WinLeadPlusMappingService implements IWinLeadPlusMappingRepository {
  private readonly logger = new Logger(WinLeadPlusMappingService.name);

  constructor(
    @InjectRepository(WinLeadPlusMappingEntity)
    private readonly repository: Repository<WinLeadPlusMappingEntity>,
  ) {}

  async findById(id: string): Promise<WinLeadPlusMappingEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByProspectId(
    organisationId: string,
    winleadplusProspectId: number,
  ): Promise<WinLeadPlusMappingEntity | null> {
    return this.repository.findOne({
      where: { organisationId, winleadplusProspectId },
    });
  }

  async findByCrmClientId(crmClientId: string): Promise<WinLeadPlusMappingEntity[]> {
    return this.repository.find({ where: { crmClientId } });
  }

  async findAll(filters?: {
    organisationId?: string;
  }): Promise<WinLeadPlusMappingEntity[]> {
    const where: Record<string, any> = {};
    if (filters?.organisationId) where.organisationId = filters.organisationId;

    return this.repository.find({ where, order: { createdAt: 'DESC' } });
  }

  async save(entity: WinLeadPlusMappingEntity): Promise<WinLeadPlusMappingEntity> {
    return this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
