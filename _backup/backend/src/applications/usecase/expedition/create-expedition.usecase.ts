import { Injectable, Inject } from '@nestjs/common';
import { ExpeditionEntity } from '../../../core/domain/expedition.entity';
import type { ExpeditionRepositoryPort } from '../../../core/port/expedition-repository.port';
import { CreateExpeditionDto } from '../../dto/expedition/create-expedition.dto';

@Injectable()
export class CreateExpeditionUseCase {
  constructor(
    @Inject('ExpeditionRepositoryPort')
    private readonly repository: ExpeditionRepositoryPort,
  ) {}

  async execute(dto: CreateExpeditionDto): Promise<ExpeditionEntity> {
    const entity = new ExpeditionEntity({
      organisationId: dto.organisationId,
      clientBaseId: dto.clientBaseId,
      contratId: dto.contratId ?? null,
      transporteurCompteId: dto.transporteurCompteId,
      trackingNumber: dto.trackingNumber,
      etat: dto.etat,
      dateCreation: new Date(dto.dateCreation),
      dateDernierStatut: new Date(dto.dateDernierStatut),
      labelUrl: dto.labelUrl,
      // Nouveaux champs
      referenceCommande: dto.referenceCommande,
      produitId: dto.produitId ?? null,
      nomProduit: dto.nomProduit ?? null,
      poids: dto.poids ?? null,
      adresseDestination: dto.adresseDestination ?? null,
      villeDestination: dto.villeDestination ?? null,
      codePostalDestination: dto.codePostalDestination ?? null,
      dateExpedition: dto.dateExpedition ? new Date(dto.dateExpedition) : null,
      dateLivraisonEstimee: dto.dateLivraisonEstimee
        ? new Date(dto.dateLivraisonEstimee)
        : null,
      dateLivraison: dto.dateLivraison ? new Date(dto.dateLivraison) : null,
      lieuActuel: dto.lieuActuel ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}
