import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ContratEntity } from '../../../core/domain/contrat.entity';
import type { ContratRepositoryPort } from '../../../core/port/contrat-repository.port';
import { UpdateContratDto } from '../../dto/contrat/update-contrat.dto';

@Injectable()
export class UpdateContratUseCase {
  constructor(
    @Inject('ContratRepositoryPort')
    private readonly repository: ContratRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateContratDto): Promise<ContratEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Contrat with id ' + id + ' not found');
    }

    if (dto.organisationId !== undefined) {
      existing.organisationId = dto.organisationId;
    }
    if (dto.reference !== undefined) {
      existing.reference = dto.reference;
    }
    if (dto.titre !== undefined) {
      existing.titre = dto.titre;
    }
    if (dto.description !== undefined) {
      existing.description = dto.description;
    }
    if (dto.type !== undefined) {
      existing.type = dto.type;
    }
    if (dto.statut !== undefined) {
      existing.statut = dto.statut;
    }
    if (dto.dateDebut !== undefined) {
      existing.dateDebut = dto.dateDebut;
    }
    if (dto.dateFin !== undefined) {
      existing.dateFin = dto.dateFin;
    }
    if (dto.dateSignature !== undefined) {
      existing.dateSignature = dto.dateSignature;
    }
    if (dto.montant !== undefined) {
      existing.montant = dto.montant;
    }
    if (dto.devise !== undefined) {
      existing.devise = dto.devise;
    }
    if (dto.frequenceFacturation !== undefined) {
      existing.frequenceFacturation = dto.frequenceFacturation;
    }
    if (dto.documentUrl !== undefined) {
      existing.documentUrl = dto.documentUrl;
    }
    if (dto.fournisseur !== undefined) {
      existing.fournisseur = dto.fournisseur;
    }
    if (dto.clientId !== undefined) {
      existing.clientId = dto.clientId;
    }
    if (dto.commercialId !== undefined) {
      existing.commercialId = dto.commercialId;
    }
    if (dto.notes !== undefined) {
      existing.notes = dto.notes;
    }
    existing.updatedAt = new Date();

    return await this.repository.update(id, existing);
  }
}
