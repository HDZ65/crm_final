import { NotificationEntity, NotificationType } from '../../core/domain/notification.entity';
import { NotificationEntity as NotificationOrmEntity } from '../../infrastructure/db/entities/notification.entity';

export class NotificationMapper {
  static toDomain(ormEntity: NotificationOrmEntity): NotificationEntity {
    return new NotificationEntity({
      id: ormEntity.id,
      organisationId: ormEntity.organisationId,
      utilisateurId: ormEntity.utilisateurId,
      type: ormEntity.type as NotificationType,
      titre: ormEntity.titre,
      message: ormEntity.message,
      lu: ormEntity.lu,
      metadata: ormEntity.metadata,
      lienUrl: ormEntity.lienUrl,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(entity: NotificationEntity): Partial<NotificationOrmEntity> {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      utilisateurId: entity.utilisateurId,
      type: entity.type,
      titre: entity.titre,
      message: entity.message,
      lu: entity.lu,
      metadata: entity.metadata,
      lienUrl: entity.lienUrl,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
