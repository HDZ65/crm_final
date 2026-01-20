import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PieceJointeRepositoryPort } from '../../core/port/piece-jointe-repository.port';
import type { PieceJointeEntity as PieceJointeDomainEntity } from '../../core/domain/piece-jointe.entity';
import { PieceJointeEntity as PieceJointeOrmEntity } from '../db/entities/piece-jointe.entity';
import { PieceJointeMapper } from '../../applications/mapper/piece-jointe.mapper';

@Injectable()
export class TypeOrmPieceJointeRepository implements PieceJointeRepositoryPort {
  constructor(
    @InjectRepository(PieceJointeOrmEntity)
    private readonly repository: Repository<PieceJointeOrmEntity>,
  ) {}

  async findById(id: string): Promise<PieceJointeDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? PieceJointeMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<PieceJointeDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => PieceJointeMapper.toDomain(entity));
  }

  async create(
    entity: PieceJointeDomainEntity,
  ): Promise<PieceJointeDomainEntity> {
    const ormEntity = this.repository.create(
      PieceJointeMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return PieceJointeMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<PieceJointeDomainEntity>,
  ): Promise<PieceJointeDomainEntity> {
    await this.repository.update(
      id,
      PieceJointeMapper.toPersistence(entity as PieceJointeDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return PieceJointeMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
