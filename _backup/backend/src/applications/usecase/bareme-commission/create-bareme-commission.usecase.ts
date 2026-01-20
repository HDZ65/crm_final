import { Injectable, Inject } from '@nestjs/common';
import { BaremeCommissionEntity } from '../../../core/domain/bareme-commission.entity';
import type { BaremeCommissionRepositoryPort } from '../../../core/port/bareme-commission-repository.port';
import { CreateBaremeCommissionDto } from '../../dto/bareme-commission/create-bareme-commission.dto';

@Injectable()
export class CreateBaremeCommissionUseCase {
  constructor(
    @Inject('BaremeCommissionRepositoryPort')
    private readonly repository: BaremeCommissionRepositoryPort,
  ) {}

  async execute(
    dto: CreateBaremeCommissionDto,
  ): Promise<BaremeCommissionEntity> {
    const entity = new BaremeCommissionEntity({
      organisationId: dto.organisationId,
      code: dto.code,
      nom: dto.nom,
      description: dto.description ?? null,
      typeCalcul: dto.typeCalcul as any,
      baseCalcul: dto.baseCalcul as any,
      montantFixe: dto.montantFixe ?? null,
      tauxPourcentage: dto.tauxPourcentage ?? null,
      precomptee: dto.precomptee ?? false,
      recurrenceActive: dto.recurrenceActive ?? false,
      tauxRecurrence: dto.tauxRecurrence ?? null,
      dureeRecurrenceMois: dto.dureeRecurrenceMois ?? null,
      dureeReprisesMois: dto.dureeReprisesMois ?? 3,
      tauxReprise: dto.tauxReprise ?? 100,
      typeProduit: (dto.typeProduit as any) ?? null,
      profilRemuneration: (dto.profilRemuneration as any) ?? null,
      societeId: dto.societeId ?? null,
      version: 1,
      dateEffet: new Date(dto.dateEffet),
      dateFin: dto.dateFin ? new Date(dto.dateFin) : null,
      actif: true,
      creePar: dto.creePar ?? null,
      modifiePar: null,
      motifModification: dto.motifModification ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(entity);
  }
}
