import { ProduitEntity } from '../../core/domain/produit.entity';
import { ProduitEntity as ProduitOrmEntity } from '../../infrastructure/db/entities/produit.entity';

export class ProduitMapper {
  static toDomain(ormEntity: ProduitOrmEntity): ProduitEntity {
    return new ProduitEntity({
      id: ormEntity.id,
      societeId: ormEntity.societeId,
      gammeId: ormEntity.gammeId,
      sku: ormEntity.sku,
      nom: ormEntity.nom,
      description: ormEntity.description,
      categorie: ormEntity.categorie,
      type: ormEntity.type,
      prix: Number(ormEntity.prix),
      tauxTVA: Number(ormEntity.tauxTVA),
      devise: ormEntity.devise,
      fournisseur: ormEntity.fournisseur,
      actif: ormEntity.actif,
      promotionActive: ormEntity.promotionActive,
      promotionPourcentage: ormEntity.promotionPourcentage ? Number(ormEntity.promotionPourcentage) : undefined,
      promotionDateDebut: ormEntity.promotionDateDebut,
      promotionDateFin: ormEntity.promotionDateFin,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(entity: ProduitEntity): Partial<ProduitOrmEntity> {
    return {
      id: entity.id,
      societeId: entity.societeId,
      gammeId: entity.gammeId,
      sku: entity.sku,
      nom: entity.nom,
      description: entity.description,
      categorie: entity.categorie,
      type: entity.type,
      prix: entity.prix,
      tauxTVA: entity.tauxTVA,
      devise: entity.devise,
      fournisseur: entity.fournisseur,
      actif: entity.actif,
      promotionActive: entity.promotionActive,
      promotionPourcentage: entity.promotionPourcentage,
      promotionDateDebut: entity.promotionDateDebut,
      promotionDateFin: entity.promotionDateFin,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
