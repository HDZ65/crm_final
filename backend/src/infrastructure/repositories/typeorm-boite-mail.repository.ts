import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { BoiteMailRepositoryPort } from '../../core/port/boite-mail-repository.port';
import type { BoiteMailEntity as BoiteMailDomainEntity } from '../../core/domain/boite-mail.entity';
import { BoiteMailEntity as BoiteMailOrmEntity } from '../db/entities/boite-mail.entity';
import { BoiteMailMapper } from '../../applications/mapper/boite-mail.mapper';

@Injectable()
export class TypeOrmBoiteMailRepository implements BoiteMailRepositoryPort {
  constructor(
    @InjectRepository(BoiteMailOrmEntity)
    private readonly repository: Repository<BoiteMailOrmEntity>,
  ) {}

  async findById(id: string): Promise<BoiteMailDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? BoiteMailMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<BoiteMailDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => BoiteMailMapper.toDomain(entity));
  }

  async findByUtilisateurId(
    utilisateurId: string,
  ): Promise<BoiteMailDomainEntity[]> {
    const entities = await this.repository.find({
      where: { utilisateurId },
      order: { estParDefaut: 'DESC', createdAt: 'ASC' },
    });
    return entities.map((entity) => BoiteMailMapper.toDomain(entity));
  }

  async findDefaultByUtilisateurId(
    utilisateurId: string,
  ): Promise<BoiteMailDomainEntity | null> {
    const entity = await this.repository.findOne({
      where: { utilisateurId, estParDefaut: true, actif: true },
    });
    return entity ? BoiteMailMapper.toDomain(entity) : null;
  }

  async create(entity: BoiteMailDomainEntity): Promise<BoiteMailDomainEntity> {
    const ormEntity = this.repository.create(
      BoiteMailMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return BoiteMailMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<BoiteMailDomainEntity>,
  ): Promise<BoiteMailDomainEntity> {
    await this.repository.update(
      id,
      BoiteMailMapper.toPersistence(entity as BoiteMailDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return BoiteMailMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
