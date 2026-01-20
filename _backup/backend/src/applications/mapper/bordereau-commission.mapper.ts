import {
  BordereauCommissionEntity,
  StatutBordereau,
} from '../../core/domain/bordereau-commission.entity';
import { BordereauCommissionEntity as BordereauCommissionOrmEntity } from '../../infrastructure/db/entities/bordereau-commission.entity';
import {
  BordereauCommissionResponseDto,
  BordereauWithDetailsResponseDto,
  ApporteurSummaryForBordereauDto,
} from '../dto/bordereau-commission/bordereau-commission-response.dto';
import { BordereauWithDetails } from '../../core/port/bordereau-commission-repository.port';

export class BordereauCommissionMapper {
  static toDomain(
    ormEntity: BordereauCommissionOrmEntity,
  ): BordereauCommissionEntity {
    return new BordereauCommissionEntity({
      id: ormEntity.id,
      organisationId: ormEntity.organisationId,
      reference: ormEntity.reference,
      periode: ormEntity.periode,
      apporteurId: ormEntity.apporteurId,
      totalBrut: Number(ormEntity.totalBrut),
      totalReprises: Number(ormEntity.totalReprises),
      totalAcomptes: Number(ormEntity.totalAcomptes),
      totalNetAPayer: Number(ormEntity.totalNetAPayer),
      nombreLignes: ormEntity.nombreLignes,
      statutBordereau: ormEntity.statutBordereau as StatutBordereau,
      dateValidation: ormEntity.dateValidation,
      validateurId: ormEntity.validateurId,
      dateExport: ormEntity.dateExport,
      fichierPdfUrl: ormEntity.fichierPdfUrl,
      fichierExcelUrl: ormEntity.fichierExcelUrl,
      commentaire: ormEntity.commentaire,
      creePar: ormEntity.creePar,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: BordereauCommissionEntity,
  ): Partial<BordereauCommissionOrmEntity> {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      reference: entity.reference,
      periode: entity.periode,
      apporteurId: entity.apporteurId,
      totalBrut: entity.totalBrut,
      totalReprises: entity.totalReprises,
      totalAcomptes: entity.totalAcomptes,
      totalNetAPayer: entity.totalNetAPayer,
      nombreLignes: entity.nombreLignes,
      statutBordereau: entity.statutBordereau,
      dateValidation: entity.dateValidation,
      validateurId: entity.validateurId,
      dateExport: entity.dateExport,
      fichierPdfUrl: entity.fichierPdfUrl,
      fichierExcelUrl: entity.fichierExcelUrl,
      commentaire: entity.commentaire,
      creePar: entity.creePar,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toResponse(
    entity: BordereauCommissionEntity,
  ): BordereauCommissionResponseDto {
    return new BordereauCommissionResponseDto({
      id: entity.id,
      organisationId: entity.organisationId,
      reference: entity.reference,
      periode: entity.periode,
      apporteurId: entity.apporteurId,
      totalBrut: entity.totalBrut,
      totalReprises: entity.totalReprises,
      totalAcomptes: entity.totalAcomptes,
      totalNetAPayer: entity.totalNetAPayer,
      nombreLignes: entity.nombreLignes,
      statutBordereau: entity.statutBordereau,
      dateValidation: entity.dateValidation,
      validateurId: entity.validateurId,
      dateExport: entity.dateExport,
      fichierPdfUrl: entity.fichierPdfUrl,
      fichierExcelUrl: entity.fichierExcelUrl,
      commentaire: entity.commentaire,
      creePar: entity.creePar,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toResponseWithDetails(
    data: BordereauWithDetails,
  ): BordereauWithDetailsResponseDto {
    return new BordereauWithDetailsResponseDto({
      id: data.bordereau.id,
      organisationId: data.bordereau.organisationId,
      reference: data.bordereau.reference,
      periode: data.bordereau.periode,
      totalBrut: data.bordereau.totalBrut,
      totalReprises: data.bordereau.totalReprises,
      totalAcomptes: data.bordereau.totalAcomptes,
      totalNetAPayer: data.bordereau.totalNetAPayer,
      nombreLignes: data.bordereau.nombreLignes,
      statutBordereau: data.bordereau.statutBordereau,
      dateValidation: data.bordereau.dateValidation,
      dateExport: data.bordereau.dateExport,
      fichierPdfUrl: data.bordereau.fichierPdfUrl,
      fichierExcelUrl: data.bordereau.fichierExcelUrl,
      apporteur: data.apporteur
        ? new ApporteurSummaryForBordereauDto({
            id: data.apporteur.id,
            nom: data.apporteur.nom,
            prenom: data.apporteur.prenom,
            typeApporteur: data.apporteur.typeApporteur,
          })
        : null,
      createdAt: data.bordereau.createdAt,
      updatedAt: data.bordereau.updatedAt,
    });
  }
}
