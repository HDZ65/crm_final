import { CommissionEntity } from '../../core/domain/commission.entity';
import { CommissionEntity as CommissionOrmEntity } from '../../infrastructure/db/entities/commission.entity';
import { CommissionResponseDto } from '../dto/commission/commission-response.dto';
import {
  CommissionWithDetailsResponseDto,
  ApporteurSummaryDto,
  ContratSummaryDto,
  ProduitSummaryDto,
  StatutSummaryDto,
} from '../dto/commission/commission-with-details-response.dto';
import { CommissionWithDetails } from '../../core/port/commission-repository.port';

export class CommissionMapper {
  static toDomain(ormEntity: CommissionOrmEntity): CommissionEntity {
    return new CommissionEntity({
      id: ormEntity.id,
      organisationId: ormEntity.organisationId,
      reference: ormEntity.reference,
      apporteurId: ormEntity.apporteurId,
      contratId: ormEntity.contratId,
      produitId: ormEntity.produitId,
      compagnie: ormEntity.compagnie,
      typeBase: ormEntity.typeBase,
      montantBrut: Number(ormEntity.montantBrut),
      montantReprises: Number(ormEntity.montantReprises),
      montantAcomptes: Number(ormEntity.montantAcomptes),
      montantNetAPayer: Number(ormEntity.montantNetAPayer),
      statutId: ormEntity.statutId,
      periode: ormEntity.periode,
      dateCreation: ormEntity.dateCreation,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(entity: CommissionEntity): Partial<CommissionOrmEntity> {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      reference: entity.reference,
      apporteurId: entity.apporteurId,
      contratId: entity.contratId,
      produitId: entity.produitId,
      compagnie: entity.compagnie,
      typeBase: entity.typeBase,
      montantBrut: entity.montantBrut,
      montantReprises: entity.montantReprises,
      montantAcomptes: entity.montantAcomptes,
      montantNetAPayer: entity.montantNetAPayer,
      statutId: entity.statutId,
      periode: entity.periode,
      dateCreation: entity.dateCreation,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toResponse(entity: CommissionEntity): CommissionResponseDto {
    return new CommissionResponseDto({
      id: entity.id,
      organisationId: entity.organisationId,
      reference: entity.reference,
      apporteurId: entity.apporteurId,
      contratId: entity.contratId,
      produitId: entity.produitId,
      compagnie: entity.compagnie,
      typeBase: entity.typeBase,
      montantBrut: entity.montantBrut,
      montantReprises: entity.montantReprises,
      montantAcomptes: entity.montantAcomptes,
      montantNetAPayer: entity.montantNetAPayer,
      statutId: entity.statutId,
      periode: entity.periode,
      dateCreation: entity.dateCreation,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toResponseWithDetails(
    data: CommissionWithDetails,
  ): CommissionWithDetailsResponseDto {
    return new CommissionWithDetailsResponseDto({
      id: data.commission.id,
      organisationId: data.commission.organisationId,
      reference: data.commission.reference,
      compagnie: data.commission.compagnie,
      typeBase: data.commission.typeBase,
      montantBrut: data.commission.montantBrut,
      montantReprises: data.commission.montantReprises,
      montantAcomptes: data.commission.montantAcomptes,
      montantNetAPayer: data.commission.montantNetAPayer,
      periode: data.commission.periode,
      dateCreation: data.commission.dateCreation,
      apporteur: data.apporteur
        ? new ApporteurSummaryDto({
            id: data.apporteur.id,
            nom: data.apporteur.nom,
            prenom: data.apporteur.prenom,
            typeApporteur: data.apporteur.typeApporteur,
          })
        : null,
      contrat: data.contrat
        ? new ContratSummaryDto({
            id: data.contrat.id,
            referenceExterne: data.contrat.referenceExterne,
            clientNom: data.contrat.clientNom,
          })
        : null,
      produit: data.produit
        ? new ProduitSummaryDto({
            id: data.produit.id,
            nom: data.produit.nom,
            sku: data.produit.sku,
          })
        : null,
      statut: data.statut
        ? new StatutSummaryDto({
            id: data.statut.id,
            code: data.statut.code,
            nom: data.statut.nom,
          })
        : null,
      createdAt: data.commission.createdAt,
      updatedAt: data.commission.updatedAt,
    });
  }
}
