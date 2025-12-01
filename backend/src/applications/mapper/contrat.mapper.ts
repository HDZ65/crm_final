import { ContratEntity } from '../../core/domain/contrat.entity';
import { ContratEntity as ContratOrmEntity } from '../../infrastructure/db/entities/contrat.entity';

export class ContratMapper {
  static toDomain(ormEntity: ContratOrmEntity): ContratEntity {
    return new ContratEntity({
      id: ormEntity.id,
      organisationId: ormEntity.organisationId,
      referenceExterne: ormEntity.referenceExterne,
      dateSignature: ormEntity.dateSignature,
      dateDebut: ormEntity.dateDebut,
      dateFin: ormEntity.dateFin,
      statutId: ormEntity.statutId,
      autoRenouvellement: ormEntity.autoRenouvellement,
      joursPreavis: ormEntity.joursPreavis,
      conditionPaiementId: ormEntity.conditionPaiementId,
      modeleDistributionId: ormEntity.modeleDistributionId,
      facturationParId: ormEntity.facturationParId,
      clientBaseId: ormEntity.clientBaseId,
      societeId: ormEntity.societeId,
      commercialId: ormEntity.commercialId,
      clientPartenaireId: ormEntity.clientPartenaireId,
      adresseFacturationId: ormEntity.adresseFacturationId,
      dateFinRetractation: ormEntity.dateFinRetractation,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(entity: ContratEntity): Partial<ContratOrmEntity> {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      referenceExterne: entity.referenceExterne,
      dateSignature: entity.dateSignature,
      dateDebut: entity.dateDebut,
      dateFin: entity.dateFin,
      statutId: entity.statutId,
      autoRenouvellement: entity.autoRenouvellement,
      joursPreavis: entity.joursPreavis,
      conditionPaiementId: entity.conditionPaiementId,
      modeleDistributionId: entity.modeleDistributionId,
      facturationParId: entity.facturationParId,
      clientBaseId: entity.clientBaseId,
      societeId: entity.societeId,
      commercialId: entity.commercialId,
      clientPartenaireId: entity.clientPartenaireId,
      adresseFacturationId: entity.adresseFacturationId,
      dateFinRetractation: entity.dateFinRetractation,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
