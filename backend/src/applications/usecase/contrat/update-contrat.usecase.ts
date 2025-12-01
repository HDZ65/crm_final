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

    if (dto.referenceExterne !== undefined) {
      existing.referenceExterne = dto.referenceExterne;
    }
    if (dto.organisationId !== undefined) {
      existing.organisationId = dto.organisationId;
    }
    if (dto.dateSignature !== undefined) {
      existing.dateSignature = dto.dateSignature;
    }
    if (dto.dateDebut !== undefined) {
      existing.dateDebut = dto.dateDebut;
    }
    if (dto.dateFin !== undefined) {
      existing.dateFin = dto.dateFin;
    }
    if (dto.statutId !== undefined) {
      existing.statutId = dto.statutId;
    }
    if (dto.autoRenouvellement !== undefined) {
      existing.autoRenouvellement = dto.autoRenouvellement;
    }
    if (dto.joursPreavis !== undefined) {
      existing.joursPreavis = dto.joursPreavis;
    }
    if (dto.conditionPaiementId !== undefined) {
      existing.conditionPaiementId = dto.conditionPaiementId;
    }
    if (dto.modeleDistributionId !== undefined) {
      existing.modeleDistributionId = dto.modeleDistributionId;
    }
    if (dto.facturationParId !== undefined) {
      existing.facturationParId = dto.facturationParId;
    }
    if (dto.clientBaseId !== undefined) {
      existing.clientBaseId = dto.clientBaseId;
    }
    if (dto.commercialId !== undefined) {
      existing.commercialId = dto.commercialId;
    }
    if (dto.clientPartenaireId !== undefined) {
      existing.clientPartenaireId = dto.clientPartenaireId;
    }
    if (dto.adresseFacturationId !== undefined) {
      existing.adresseFacturationId = dto.adresseFacturationId;
    }
    if (dto.dateFinRetractation !== undefined) {
      existing.dateFinRetractation = dto.dateFinRetractation;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}
