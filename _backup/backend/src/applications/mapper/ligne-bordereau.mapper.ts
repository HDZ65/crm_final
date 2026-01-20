import {
  LigneBordereauEntity,
  TypeLigne,
  StatutLigne,
} from '../../core/domain/ligne-bordereau.entity';
import { LigneBordereauEntity as LigneBordereauOrmEntity } from '../../infrastructure/db/entities/ligne-bordereau.entity';
import { LigneBordereauResponseDto } from '../dto/ligne-bordereau/ligne-bordereau-response.dto';

export class LigneBordereauMapper {
  static toDomain(ormEntity: LigneBordereauOrmEntity): LigneBordereauEntity {
    return new LigneBordereauEntity({
      id: ormEntity.id,
      organisationId: ormEntity.organisationId,
      bordereauId: ormEntity.bordereauId,
      commissionId: ormEntity.commissionId,
      repriseId: ormEntity.repriseId,
      typeLigne: ormEntity.typeLigne as TypeLigne,
      contratId: ormEntity.contratId,
      contratReference: ormEntity.contratReference,
      clientNom: ormEntity.clientNom,
      produitNom: ormEntity.produitNom,
      montantBrut: Number(ormEntity.montantBrut),
      montantReprise: Number(ormEntity.montantReprise),
      montantNet: Number(ormEntity.montantNet),
      baseCalcul: ormEntity.baseCalcul,
      tauxApplique: ormEntity.tauxApplique
        ? Number(ormEntity.tauxApplique)
        : null,
      baremeId: ormEntity.baremeId,
      statutLigne: ormEntity.statutLigne as StatutLigne,
      selectionne: ormEntity.selectionne,
      motifDeselection: ormEntity.motifDeselection,
      validateurId: ormEntity.validateurId,
      dateValidation: ormEntity.dateValidation,
      ordre: ormEntity.ordre,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: LigneBordereauEntity,
  ): Partial<LigneBordereauOrmEntity> {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      bordereauId: entity.bordereauId,
      commissionId: entity.commissionId,
      repriseId: entity.repriseId,
      typeLigne: entity.typeLigne,
      contratId: entity.contratId,
      contratReference: entity.contratReference,
      clientNom: entity.clientNom,
      produitNom: entity.produitNom,
      montantBrut: entity.montantBrut,
      montantReprise: entity.montantReprise,
      montantNet: entity.montantNet,
      baseCalcul: entity.baseCalcul,
      tauxApplique: entity.tauxApplique,
      baremeId: entity.baremeId,
      statutLigne: entity.statutLigne,
      selectionne: entity.selectionne,
      motifDeselection: entity.motifDeselection,
      validateurId: entity.validateurId,
      dateValidation: entity.dateValidation,
      ordre: entity.ordre,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toResponse(entity: LigneBordereauEntity): LigneBordereauResponseDto {
    return new LigneBordereauResponseDto({
      id: entity.id,
      organisationId: entity.organisationId,
      bordereauId: entity.bordereauId,
      commissionId: entity.commissionId,
      repriseId: entity.repriseId,
      typeLigne: entity.typeLigne,
      contratId: entity.contratId,
      contratReference: entity.contratReference,
      clientNom: entity.clientNom,
      produitNom: entity.produitNom,
      montantBrut: entity.montantBrut,
      montantReprise: entity.montantReprise,
      montantNet: entity.montantNet,
      baseCalcul: entity.baseCalcul,
      tauxApplique: entity.tauxApplique,
      baremeId: entity.baremeId,
      statutLigne: entity.statutLigne,
      selectionne: entity.selectionne,
      motifDeselection: entity.motifDeselection,
      validateurId: entity.validateurId,
      dateValidation: entity.dateValidation,
      ordre: entity.ordre,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
