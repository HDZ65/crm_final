import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReducBoxAccessHistoryEntity } from '../../../../../domain/reducbox/entities/reducbox-access-history.entity';

@Injectable()
export class ReducBoxAccessHistoryService {
  constructor(
    @InjectRepository(ReducBoxAccessHistoryEntity)
    private readonly repository: Repository<ReducBoxAccessHistoryEntity>,
  ) {}

  async findByAccessId(accessId: string): Promise<ReducBoxAccessHistoryEntity[]> {
    return this.repository.find({
      where: { accessId },
      order: { changedAt: 'DESC' },
    });
  }

  async create(input: Partial<ReducBoxAccessHistoryEntity>): Promise<ReducBoxAccessHistoryEntity> {
    const entity = this.repository.create(input);
    return this.repository.save(entity);
  }

  async findAll(): Promise<ReducBoxAccessHistoryEntity[]> {
    return this.repository.find({ order: { changedAt: 'DESC' } });
  }
}
