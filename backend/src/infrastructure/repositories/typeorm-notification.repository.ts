import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import type { NotificationRepositoryPort } from '../../core/port/notification-repository.port';
import type { NotificationEntity as NotificationDomainEntity } from '../../core/domain/notification.entity';
import { NotificationEntity as NotificationOrmEntity } from '../db/entities/notification.entity';
import { NotificationMapper } from '../../applications/mapper/notification.mapper';

@Injectable()
export class TypeOrmNotificationRepository implements NotificationRepositoryPort {
  constructor(
    @InjectRepository(NotificationOrmEntity)
    private readonly repository: Repository<NotificationOrmEntity>,
  ) {}

  async findById(id: string): Promise<NotificationDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? NotificationMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<NotificationDomainEntity[]> {
    const entities = await this.repository.find({
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => NotificationMapper.toDomain(entity));
  }

  async findByUtilisateurId(utilisateurId: string): Promise<NotificationDomainEntity[]> {
    const entities = await this.repository.find({
      where: { utilisateurId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => NotificationMapper.toDomain(entity));
  }

  async findUnreadByUtilisateurId(utilisateurId: string): Promise<NotificationDomainEntity[]> {
    const entities = await this.repository.find({
      where: { utilisateurId, lu: false },
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => NotificationMapper.toDomain(entity));
  }

  async countUnreadByUtilisateurId(utilisateurId: string): Promise<number> {
    return await this.repository.count({
      where: { utilisateurId, lu: false },
    });
  }

  async markAsRead(id: string): Promise<NotificationDomainEntity> {
    await this.repository.update(id, { lu: true });
    const updated = await this.repository.findOne({ where: { id } });
    return NotificationMapper.toDomain(updated!);
  }

  async markAllAsReadByUtilisateurId(utilisateurId: string): Promise<void> {
    await this.repository.update({ utilisateurId, lu: false }, { lu: true });
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.repository.delete({
      createdAt: LessThan(date),
    });
    return result.affected || 0;
  }

  async create(entity: NotificationDomainEntity): Promise<NotificationDomainEntity> {
    const ormEntity = this.repository.create(
      NotificationMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return NotificationMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<NotificationDomainEntity>,
  ): Promise<NotificationDomainEntity> {
    await this.repository.update(
      id,
      NotificationMapper.toPersistence(entity as NotificationDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return NotificationMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
