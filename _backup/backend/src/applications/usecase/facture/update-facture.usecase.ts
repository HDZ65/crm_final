import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { FactureEntity } from '../../../core/domain/facture.entity';
import type { FactureRepositoryPort } from '../../../core/port/facture-repository.port';
import { UpdateFactureDto } from '../../dto/facture/update-facture.dto';

@Injectable()
export class UpdateFactureUseCase {
  constructor(
    @Inject('FactureRepositoryPort')
    private readonly repository: FactureRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateFactureDto): Promise<FactureEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Facture with id ' + id + ' not found');
    }

    if (dto.organisationId !== undefined) {
      existing.organisationId = dto.organisationId;
    }
    if (dto.numero !== undefined) {
      existing.numero = dto.numero;
    }
    if (dto.dateEmission !== undefined) {
      existing.dateEmission = dto.dateEmission;
    }
    if (dto.montantHT !== undefined) {
      existing.montantHT = dto.montantHT;
    }
    if (dto.montantTTC !== undefined) {
      existing.montantTTC = dto.montantTTC;
    }
    if (dto.statutId !== undefined) {
      existing.statutId = dto.statutId;
    }
    if (dto.emissionFactureId !== undefined) {
      existing.emissionFactureId = dto.emissionFactureId;
    }
    if (dto.clientBaseId !== undefined) {
      existing.clientBaseId = dto.clientBaseId;
    }
    if (dto.contratId !== undefined) {
      existing.contratId = dto.contratId;
    }
    if (dto.clientPartenaireId !== undefined) {
      existing.clientPartenaireId = dto.clientPartenaireId;
    }
    if (dto.adresseFacturationId !== undefined) {
      existing.adresseFacturationId = dto.adresseFacturationId;
    }
    existing.updatedAt = new Date();

    return await this.repository.update(id, existing);
  }
}
