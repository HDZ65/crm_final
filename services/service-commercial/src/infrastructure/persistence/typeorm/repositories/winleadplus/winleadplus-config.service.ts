import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WinLeadPlusConfigEntity } from '../../../../../domain/winleadplus/entities/winleadplus-config.entity';
import { IWinLeadPlusConfigRepository } from '../../../../../domain/winleadplus/repositories/IWinLeadPlusConfigRepository';

@Injectable()
export class WinLeadPlusConfigService implements IWinLeadPlusConfigRepository {
  private readonly logger = new Logger(WinLeadPlusConfigService.name);

  constructor(
    @InjectRepository(WinLeadPlusConfigEntity)
    private readonly repository: Repository<WinLeadPlusConfigEntity>,
  ) {}

  async findById(id: string): Promise<WinLeadPlusConfigEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByOrganisationId(organisationId: string): Promise<WinLeadPlusConfigEntity | null> {
    return this.repository.findOne({ where: { organisationId } });
  }

  async findAllEnabled(): Promise<WinLeadPlusConfigEntity[]> {
    return this.repository.find({ where: { enabled: true } });
  }

  async save(entity: WinLeadPlusConfigEntity): Promise<WinLeadPlusConfigEntity> {
    return this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
