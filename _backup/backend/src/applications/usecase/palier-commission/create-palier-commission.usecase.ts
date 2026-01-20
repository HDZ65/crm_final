import { Injectable, Inject } from '@nestjs/common';
import { PalierCommissionEntity } from '../../../core/domain/palier-commission.entity';
import type { PalierCommissionRepositoryPort } from '../../../core/port/palier-commission-repository.port';
import { CreatePalierCommissionDto } from '../../dto/palier-commission/create-palier-commission.dto';

@Injectable()
export class CreatePalierCommissionUseCase {
  constructor(
    @Inject('PalierCommissionRepositoryPort')
    private readonly repository: PalierCommissionRepositoryPort,
  ) {}

  async execute(
    dto: CreatePalierCommissionDto,
  ): Promise<PalierCommissionEntity> {
    const entity = new PalierCommissionEntity({
      organisationId: dto.organisationId,
      baremeId: dto.baremeId,
      code: dto.code,
      nom: dto.nom,
      description: dto.description ?? null,
      typePalier: dto.typePalier as any,
      seuilMin: dto.seuilMin,
      seuilMax: dto.seuilMax ?? null,
      montantPrime: dto.montantPrime,
      tauxBonus: dto.tauxBonus ?? null,
      cumulable: dto.cumulable ?? true,
      parPeriode: dto.parPeriode ?? true,
      typeProduit: dto.typeProduit ?? null,
      ordre: dto.ordre ?? 0,
      actif: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(entity);
  }
}
