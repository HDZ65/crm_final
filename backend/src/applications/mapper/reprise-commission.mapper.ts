import { RepriseCommissionEntity } from '../../core/domain/reprise-commission.entity';
import { RepriseCommissionEntity as RepriseCommissionOrmEntity } from '../../infrastructure/db/entities/reprise-commission.entity';
import { RepriseCommissionResponseDto } from '../dto/reprise-commission/reprise-commission-response.dto';

export class RepriseCommissionMapper {
  static toDomain(
    ormEntity: RepriseCommissionOrmEntity,
  ): RepriseCommissionEntity {
    return new RepriseCommissionEntity({
      id: ormEntity.id,
      organisationId: ormEntity.organisationId,
      commissionOriginaleId: ormEntity.commissionOriginaleId,
      contratId: ormEntity.contratId,
      apporteurId: ormEntity.apporteurId,
      reference: ormEntity.reference,
      typeReprise: ormEntity.typeReprise as any,
      montantReprise: Number(ormEntity.montantReprise),
      tauxReprise: Number(ormEntity.tauxReprise),
      montantOriginal: Number(ormEntity.montantOriginal),
      periodeOrigine: ormEntity.periodeOrigine,
      periodeApplication: ormEntity.periodeApplication,
      dateEvenement: ormEntity.dateEvenement,
      dateLimite: ormEntity.dateLimite,
      dateApplication: ormEntity.dateApplication,
      statutReprise: ormEntity.statutReprise as any,
      bordereauId: ormEntity.bordereauId,
      motif: ormEntity.motif,
      commentaire: ormEntity.commentaire,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: RepriseCommissionEntity,
  ): Partial<RepriseCommissionOrmEntity> {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      commissionOriginaleId: entity.commissionOriginaleId,
      contratId: entity.contratId,
      apporteurId: entity.apporteurId,
      reference: entity.reference,
      typeReprise: entity.typeReprise,
      montantReprise: entity.montantReprise,
      tauxReprise: entity.tauxReprise,
      montantOriginal: entity.montantOriginal,
      periodeOrigine: entity.periodeOrigine,
      periodeApplication: entity.periodeApplication,
      dateEvenement: entity.dateEvenement,
      dateLimite: entity.dateLimite,
      dateApplication: entity.dateApplication,
      statutReprise: entity.statutReprise,
      bordereauId: entity.bordereauId,
      motif: entity.motif,
      commentaire: entity.commentaire,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toResponse(
    entity: RepriseCommissionEntity,
  ): RepriseCommissionResponseDto {
    return new RepriseCommissionResponseDto({
      id: entity.id,
      organisationId: entity.organisationId,
      commissionOriginaleId: entity.commissionOriginaleId,
      contratId: entity.contratId,
      apporteurId: entity.apporteurId,
      reference: entity.reference,
      typeReprise: entity.typeReprise,
      montantReprise: entity.montantReprise,
      tauxReprise: entity.tauxReprise,
      montantOriginal: entity.montantOriginal,
      periodeOrigine: entity.periodeOrigine,
      periodeApplication: entity.periodeApplication,
      dateEvenement: entity.dateEvenement,
      dateLimite: entity.dateLimite,
      dateApplication: entity.dateApplication,
      statutReprise: entity.statutReprise,
      bordereauId: entity.bordereauId,
      motif: entity.motif,
      commentaire: entity.commentaire,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
