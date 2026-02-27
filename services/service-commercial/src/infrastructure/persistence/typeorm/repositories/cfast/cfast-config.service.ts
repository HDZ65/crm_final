import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CfastConfigEntity } from '../../../../../domain/cfast/entities/cfast-config.entity';
import { ICfastConfigRepository } from '../../../../../domain/cfast/repositories/ICfastConfigRepository';

@Injectable()
export class CfastConfigService implements ICfastConfigRepository {
  private readonly logger = new Logger(CfastConfigService.name);

  constructor(
    @InjectRepository(CfastConfigEntity)
    private readonly repository: Repository<CfastConfigEntity>,
  ) {}

  async findById(id: string): Promise<CfastConfigEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByOrganisationId(organisationId: string): Promise<CfastConfigEntity | null> {
    return this.repository.findOne({ where: { organisationId } });
  }

  async findAllActive(): Promise<CfastConfigEntity[]> {
    return this.repository.find({
      where: { active: true },
      order: { createdAt: 'ASC' },
    });
  }

  async save(entity: CfastConfigEntity): Promise<CfastConfigEntity> {
    return this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
