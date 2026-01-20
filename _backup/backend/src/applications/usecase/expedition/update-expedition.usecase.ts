import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ExpeditionEntity } from '../../../core/domain/expedition.entity';
import type { ExpeditionRepositoryPort } from '../../../core/port/expedition-repository.port';
import { UpdateExpeditionDto } from '../../dto/expedition/update-expedition.dto';

@Injectable()
export class UpdateExpeditionUseCase {
  constructor(
    @Inject('ExpeditionRepositoryPort')
    private readonly repository: ExpeditionRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateExpeditionDto,
  ): Promise<ExpeditionEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Expedition with id ' + id + ' not found');
    }

    if (dto.organisationId !== undefined) {
      existing.organisationId = dto.organisationId;
    }
    if (dto.clientBaseId !== undefined) {
      existing.clientBaseId = dto.clientBaseId;
    }
    if (dto.contratId !== undefined) {
      existing.contratId = dto.contratId;
    }
    if (dto.transporteurCompteId !== undefined) {
      existing.transporteurCompteId = dto.transporteurCompteId;
    }
    if (dto.trackingNumber !== undefined) {
      existing.trackingNumber = dto.trackingNumber;
    }
    if (dto.etat !== undefined) {
      existing.etat = dto.etat;
    }
    if (dto.dateCreation !== undefined) {
      existing.dateCreation = new Date(dto.dateCreation);
    }
    if (dto.dateDernierStatut !== undefined) {
      existing.dateDernierStatut = new Date(dto.dateDernierStatut);
    }
    if (dto.labelUrl !== undefined) {
      existing.labelUrl = dto.labelUrl;
    }
    // Nouveaux champs
    if (dto.referenceCommande !== undefined) {
      existing.referenceCommande = dto.referenceCommande;
    }
    if (dto.produitId !== undefined) {
      existing.produitId = dto.produitId;
    }
    if (dto.nomProduit !== undefined) {
      existing.nomProduit = dto.nomProduit;
    }
    if (dto.poids !== undefined) {
      existing.poids = dto.poids;
    }
    if (dto.adresseDestination !== undefined) {
      existing.adresseDestination = dto.adresseDestination;
    }
    if (dto.villeDestination !== undefined) {
      existing.villeDestination = dto.villeDestination;
    }
    if (dto.codePostalDestination !== undefined) {
      existing.codePostalDestination = dto.codePostalDestination;
    }
    if (dto.dateExpedition !== undefined) {
      existing.dateExpedition = dto.dateExpedition
        ? new Date(dto.dateExpedition)
        : null;
    }
    if (dto.dateLivraisonEstimee !== undefined) {
      existing.dateLivraisonEstimee = dto.dateLivraisonEstimee
        ? new Date(dto.dateLivraisonEstimee)
        : null;
    }
    if (dto.dateLivraison !== undefined) {
      existing.dateLivraison = dto.dateLivraison
        ? new Date(dto.dateLivraison)
        : null;
    }
    if (dto.lieuActuel !== undefined) {
      existing.lieuActuel = dto.lieuActuel;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}
