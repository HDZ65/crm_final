import { ThemeMarqueEntity } from '../../core/domain/theme-marque.entity';
import { ThemeMarqueEntity as ThemeMarqueOrmEntity } from '../../infrastructure/db/entities/theme-marque.entity';

export class ThemeMarqueMapper {
  static toDomain(ormEntity: ThemeMarqueOrmEntity): ThemeMarqueEntity {
    return new ThemeMarqueEntity({
      id: ormEntity.id,
      logoUrl: ormEntity.logoUrl,
      couleurPrimaire: ormEntity.couleurPrimaire,
      couleurSecondaire: ormEntity.couleurSecondaire,
      faviconUrl: ormEntity.faviconUrl,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: ThemeMarqueEntity,
  ): Partial<ThemeMarqueOrmEntity> {
    return {
      id: entity.id,
      logoUrl: entity.logoUrl,
      couleurPrimaire: entity.couleurPrimaire,
      couleurSecondaire: entity.couleurSecondaire,
      faviconUrl: entity.faviconUrl,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
