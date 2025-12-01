import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PalierCommissionEntity } from '../../../core/domain/palier-commission.entity';
import type { PalierCommissionRepositoryPort } from '../../../core/port/palier-commission-repository.port';
import { UpdatePalierCommissionDto } from '../../dto/palier-commission/update-palier-commission.dto';

@Injectable()
export class UpdatePalierCommissionUseCase {
  constructor(
    @Inject('PalierCommissionRepositoryPort')
    private readonly repository: PalierCommissionRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdatePalierCommissionDto,
  ): Promise<PalierCommissionEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('PalierCommission with id ' + id + ' not found');
    }

    if (dto.code !== undefined) existing.code = dto.code;
    if (dto.nom !== undefined) existing.nom = dto.nom;
    if (dto.description !== undefined) existing.description = dto.description;
    if (dto.typePalier !== undefined) existing.typePalier = dto.typePalier as any;
    if (dto.seuilMin !== undefined) existing.seuilMin = dto.seuilMin;
    if (dto.seuilMax !== undefined) existing.seuilMax = dto.seuilMax;
    if (dto.montantPrime !== undefined) existing.montantPrime = dto.montantPrime;
    if (dto.tauxBonus !== undefined) existing.tauxBonus = dto.tauxBonus;
    if (dto.cumulable !== undefined) existing.cumulable = dto.cumulable;
    if (dto.parPeriode !== undefined) existing.parPeriode = dto.parPeriode;
    if (dto.typeProduit !== undefined) existing.typeProduit = dto.typeProduit;
    if (dto.ordre !== undefined) existing.ordre = dto.ordre;

    existing.updatedAt = new Date();

    return await this.repository.update(id, existing);
  }
}
