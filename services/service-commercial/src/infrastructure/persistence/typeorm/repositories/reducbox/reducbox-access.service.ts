import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ReducBoxAccessEntity,
  ReducBoxAccessStatus,
} from '../../../../../domain/reducbox/entities/reducbox-access.entity';
import { ReducBoxAccessHistoryEntity } from '../../../../../domain/reducbox/entities/reducbox-access-history.entity';
import { IReducBoxAccessRepository } from '../../../../../domain/reducbox/repositories/IReducBoxAccessRepository';

@Injectable()
export class ReducBoxAccessRepositoryService implements IReducBoxAccessRepository {
  private readonly logger = new Logger(ReducBoxAccessRepositoryService.name);

  constructor(
    @InjectRepository(ReducBoxAccessEntity)
    private readonly accessRepository: Repository<ReducBoxAccessEntity>,
    @InjectRepository(ReducBoxAccessHistoryEntity)
    private readonly historyRepository: Repository<ReducBoxAccessHistoryEntity>,
  ) {}

  async findById(id: string): Promise<ReducBoxAccessEntity | null> {
    return this.accessRepository.findOne({ where: { id } });
  }

  async findByClientId(clientId: string): Promise<ReducBoxAccessEntity[]> {
    return this.accessRepository.find({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByContratId(contratId: string): Promise<ReducBoxAccessEntity | null> {
    return this.accessRepository.findOne({
      where: { contratId },
    });
  }

  async findByStatus(status: ReducBoxAccessStatus): Promise<ReducBoxAccessEntity[]> {
    return this.accessRepository.find({
      where: { status },
      order: { createdAt: 'DESC' },
    });
  }

  async create(entity: Partial<ReducBoxAccessEntity>): Promise<ReducBoxAccessEntity> {
    const created = this.accessRepository.create(entity);
    return this.accessRepository.save(created);
  }

  async update(entity: ReducBoxAccessEntity): Promise<ReducBoxAccessEntity> {
    return this.accessRepository.save(entity);
  }

  async addHistory(history: Partial<ReducBoxAccessHistoryEntity>): Promise<ReducBoxAccessHistoryEntity> {
    const created = this.historyRepository.create(history);
    return this.historyRepository.save(created);
  }
}
