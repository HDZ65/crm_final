import { ProduitEntity } from '../../core/domain/produit.entity';
import { ProduitEntity as ProduitOrmEntity } from '../../infrastructure/db/entities/produit.entity';

export class ProduitMapper {
  static toDomain(ormEntity: ProduitOrmEntity): ProduitEntity {
    return new ProduitEntity({
      id: ormEntity.id,
      sku: ormEntity.sku,
      nom: ormEntity.nom,
      description: ormEntity.description,
      actif: ormEntity.actif,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(entity: ProduitEntity): Partial<ProduitOrmEntity> {
    return {
      id: entity.id,
      sku: entity.sku,
      nom: entity.nom,
      description: entity.description,
      actif: entity.actif,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
