import { PalierCommissionEntity } from '../../core/domain/palier-commission.entity';
import { PalierCommissionEntity as PalierCommissionOrmEntity } from '../../infrastructure/db/entities/palier-commission.entity';
import { PalierCommissionResponseDto } from '../dto/palier-commission/palier-commission-response.dto';

export class PalierCommissionMapper {
  static toDomain(
    ormEntity: PalierCommissionOrmEntity,
  ): PalierCommissionEntity {
    return new PalierCommissionEntity({
      id: ormEntity.id,
      organisationId: ormEntity.organisationId,
      baremeId: ormEntity.baremeId,
      code: ormEntity.code,
      nom: ormEntity.nom,
      description: ormEntity.description,
      typePalier: ormEntity.typePalier as any,
      seuilMin: Number(ormEntity.seuilMin),
      seuilMax: ormEntity.seuilMax ? Number(ormEntity.seuilMax) : null,
      montantPrime: Number(ormEntity.montantPrime),
      tauxBonus: ormEntity.tauxBonus ? Number(ormEntity.tauxBonus) : null,
      cumulable: ormEntity.cumulable,
      parPeriode: ormEntity.parPeriode,
      typeProduit: ormEntity.typeProduit,
      ordre: ormEntity.ordre,
      actif: ormEntity.actif,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: PalierCommissionEntity,
  ): Partial<PalierCommissionOrmEntity> {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      baremeId: entity.baremeId,
      code: entity.code,
      nom: entity.nom,
      description: entity.description,
      typePalier: entity.typePalier,
      seuilMin: entity.seuilMin,
      seuilMax: entity.seuilMax,
      montantPrime: entity.montantPrime,
      tauxBonus: entity.tauxBonus,
      cumulable: entity.cumulable,
      parPeriode: entity.parPeriode,
      typeProduit: entity.typeProduit,
      ordre: entity.ordre,
      actif: entity.actif,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toResponse(
    entity: PalierCommissionEntity,
  ): PalierCommissionResponseDto {
    return new PalierCommissionResponseDto({
      id: entity.id,
      organisationId: entity.organisationId,
      baremeId: entity.baremeId,
      code: entity.code,
      nom: entity.nom,
      description: entity.description,
      typePalier: entity.typePalier,
      seuilMin: entity.seuilMin,
      seuilMax: entity.seuilMax,
      montantPrime: entity.montantPrime,
      tauxBonus: entity.tauxBonus,
      cumulable: entity.cumulable,
      parPeriode: entity.parPeriode,
      typeProduit: entity.typeProduit,
      ordre: entity.ordre,
      actif: entity.actif,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
