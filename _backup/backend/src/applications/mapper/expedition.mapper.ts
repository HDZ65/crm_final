import { ExpeditionEntity } from '../../core/domain/expedition.entity';
import { ExpeditionEntity as ExpeditionOrmEntity } from '../../infrastructure/db/entities/expedition.entity';

export class ExpeditionMapper {
  static toDomain(ormEntity: ExpeditionOrmEntity): ExpeditionEntity {
    return new ExpeditionEntity({
      id: ormEntity.id,
      organisationId: ormEntity.organisationId,
      clientBaseId: ormEntity.clientBaseId,
      contratId: ormEntity.contratId,
      transporteurCompteId: ormEntity.transporteurCompteId,
      trackingNumber: ormEntity.trackingNumber,
      etat: ormEntity.etat,
      dateCreation: ormEntity.dateCreation,
      dateDernierStatut: ormEntity.dateDernierStatut,
      labelUrl: ormEntity.labelUrl,
      // Nouveaux champs
      referenceCommande: ormEntity.referenceCommande,
      produitId: ormEntity.produitId,
      nomProduit: ormEntity.nomProduit,
      poids: ormEntity.poids ? Number(ormEntity.poids) : null,
      adresseDestination: ormEntity.adresseDestination,
      villeDestination: ormEntity.villeDestination,
      codePostalDestination: ormEntity.codePostalDestination,
      dateExpedition: ormEntity.dateExpedition,
      dateLivraisonEstimee: ormEntity.dateLivraisonEstimee,
      dateLivraison: ormEntity.dateLivraison,
      lieuActuel: ormEntity.lieuActuel,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(entity: ExpeditionEntity): Partial<ExpeditionOrmEntity> {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      clientBaseId: entity.clientBaseId,
      contratId: entity.contratId,
      transporteurCompteId: entity.transporteurCompteId,
      trackingNumber: entity.trackingNumber,
      etat: entity.etat,
      dateCreation: entity.dateCreation,
      dateDernierStatut: entity.dateDernierStatut,
      labelUrl: entity.labelUrl,
      // Nouveaux champs
      referenceCommande: entity.referenceCommande,
      produitId: entity.produitId,
      nomProduit: entity.nomProduit,
      poids: entity.poids,
      adresseDestination: entity.adresseDestination,
      villeDestination: entity.villeDestination,
      codePostalDestination: entity.codePostalDestination,
      dateExpedition: entity.dateExpedition,
      dateLivraisonEstimee: entity.dateLivraisonEstimee,
      dateLivraison: entity.dateLivraison,
      lieuActuel: entity.lieuActuel,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
