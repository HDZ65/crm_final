import { PrixProduitEntity } from '../../core/domain/prix-produit.entity';
import { PrixProduitEntity as PrixProduitOrmEntity } from '../../infrastructure/db/entities/prix-produit.entity';

export class PrixProduitMapper {
  static toDomain(ormEntity: PrixProduitOrmEntity): PrixProduitEntity {
    return new PrixProduitEntity({
      id: ormEntity.id,
      prix: ormEntity.prix,
      periodeFacturationId: ormEntity.periodeFacturationId,
      remisePourcent: ormEntity.remisePourcent,
      produitId: ormEntity.produitId,
      grilleTarifaireId: ormEntity.grilleTarifaireId,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: PrixProduitEntity,
  ): Partial<PrixProduitOrmEntity> {
    return {
      id: entity.id,
      prix: entity.prix,
      periodeFacturationId: entity.periodeFacturationId,
      remisePourcent: entity.remisePourcent,
      produitId: entity.produitId,
      grilleTarifaireId: entity.grilleTarifaireId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
