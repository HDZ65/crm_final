import { AdresseEntity } from '../../core/domain/adresse.entity';
import { AdresseEntity as AdresseOrmEntity } from '../../infrastructure/db/entities/adresse.entity';

export class AdresseMapper {
  static toDomain(ormEntity: AdresseOrmEntity): AdresseEntity {
    return new AdresseEntity({
      id: ormEntity.id,
      clientBaseId: ormEntity.clientBaseId,
      ligne1: ormEntity.ligne1,
      ligne2: ormEntity.ligne2 ?? null,
      codePostal: ormEntity.codePostal,
      ville: ormEntity.ville,
      pays: ormEntity.pays,
      type: ormEntity.type,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(entity: AdresseEntity): Partial<AdresseOrmEntity> {
    return {
      id: entity.id,
      clientBaseId: entity.clientBaseId,
      ligne1: entity.ligne1,
      ligne2: entity.ligne2 ?? null,
      codePostal: entity.codePostal,
      ville: entity.ville,
      pays: entity.pays,
      type: entity.type,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
