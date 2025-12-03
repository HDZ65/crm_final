import { BaremeCommissionEntity } from '../../core/domain/bareme-commission.entity';
import { BaremeCommissionEntity as BaremeCommissionOrmEntity } from '../../infrastructure/db/entities/bareme-commission.entity';
import { BaremeCommissionResponseDto } from '../dto/bareme-commission/bareme-commission-response.dto';

export class BaremeCommissionMapper {
  static toDomain(
    ormEntity: BaremeCommissionOrmEntity,
  ): BaremeCommissionEntity {
    return new BaremeCommissionEntity({
      id: ormEntity.id,
      organisationId: ormEntity.organisationId,
      code: ormEntity.code,
      nom: ormEntity.nom,
      description: ormEntity.description,
      typeCalcul: ormEntity.typeCalcul as any,
      baseCalcul: ormEntity.baseCalcul as any,
      montantFixe: ormEntity.montantFixe ? Number(ormEntity.montantFixe) : null,
      tauxPourcentage: ormEntity.tauxPourcentage
        ? Number(ormEntity.tauxPourcentage)
        : null,
      precomptee: ormEntity.precomptee,
      recurrenceActive: ormEntity.recurrenceActive,
      tauxRecurrence: ormEntity.tauxRecurrence
        ? Number(ormEntity.tauxRecurrence)
        : null,
      dureeRecurrenceMois: ormEntity.dureeRecurrenceMois,
      dureeReprisesMois: ormEntity.dureeReprisesMois,
      tauxReprise: Number(ormEntity.tauxReprise),
      typeProduit: ormEntity.typeProduit as any,
      profilRemuneration: ormEntity.profilRemuneration as any,
      societeId: ormEntity.societeId,
      canalVente: ormEntity.canalVente as any,
      repartitionCommercial: Number(ormEntity.repartitionCommercial),
      repartitionManager: Number(ormEntity.repartitionManager),
      repartitionAgence: Number(ormEntity.repartitionAgence),
      repartitionEntreprise: Number(ormEntity.repartitionEntreprise),
      version: ormEntity.version,
      dateEffet: ormEntity.dateEffet,
      dateFin: ormEntity.dateFin,
      actif: ormEntity.actif,
      creePar: ormEntity.creePar,
      modifiePar: ormEntity.modifiePar,
      motifModification: ormEntity.motifModification,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: BaremeCommissionEntity,
  ): Partial<BaremeCommissionOrmEntity> {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      code: entity.code,
      nom: entity.nom,
      description: entity.description,
      typeCalcul: entity.typeCalcul,
      baseCalcul: entity.baseCalcul,
      montantFixe: entity.montantFixe,
      tauxPourcentage: entity.tauxPourcentage,
      precomptee: entity.precomptee,
      recurrenceActive: entity.recurrenceActive,
      tauxRecurrence: entity.tauxRecurrence,
      dureeRecurrenceMois: entity.dureeRecurrenceMois,
      dureeReprisesMois: entity.dureeReprisesMois,
      tauxReprise: entity.tauxReprise,
      typeProduit: entity.typeProduit,
      profilRemuneration: entity.profilRemuneration,
      societeId: entity.societeId,
      canalVente: entity.canalVente,
      repartitionCommercial: entity.repartitionCommercial,
      repartitionManager: entity.repartitionManager,
      repartitionAgence: entity.repartitionAgence,
      repartitionEntreprise: entity.repartitionEntreprise,
      version: entity.version,
      dateEffet: entity.dateEffet,
      dateFin: entity.dateFin,
      actif: entity.actif,
      creePar: entity.creePar,
      modifiePar: entity.modifiePar,
      motifModification: entity.motifModification,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toResponse(
    entity: BaremeCommissionEntity,
  ): BaremeCommissionResponseDto {
    return new BaremeCommissionResponseDto({
      id: entity.id,
      organisationId: entity.organisationId,
      code: entity.code,
      nom: entity.nom,
      description: entity.description,
      typeCalcul: entity.typeCalcul,
      baseCalcul: entity.baseCalcul,
      montantFixe: entity.montantFixe,
      tauxPourcentage: entity.tauxPourcentage,
      precomptee: entity.precomptee,
      recurrenceActive: entity.recurrenceActive,
      tauxRecurrence: entity.tauxRecurrence,
      dureeRecurrenceMois: entity.dureeRecurrenceMois,
      dureeReprisesMois: entity.dureeReprisesMois,
      tauxReprise: entity.tauxReprise,
      typeProduit: entity.typeProduit,
      profilRemuneration: entity.profilRemuneration,
      societeId: entity.societeId,
      canalVente: entity.canalVente,
      repartitionCommercial: entity.repartitionCommercial,
      repartitionManager: entity.repartitionManager,
      repartitionAgence: entity.repartitionAgence,
      repartitionEntreprise: entity.repartitionEntreprise,
      version: entity.version,
      dateEffet: entity.dateEffet,
      dateFin: entity.dateFin,
      actif: entity.actif,
      creePar: entity.creePar,
      modifiePar: entity.modifiePar,
      motifModification: entity.motifModification,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
