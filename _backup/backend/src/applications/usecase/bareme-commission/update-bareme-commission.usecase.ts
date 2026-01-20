import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { BaremeCommissionEntity } from '../../../core/domain/bareme-commission.entity';
import type { BaremeCommissionRepositoryPort } from '../../../core/port/bareme-commission-repository.port';
import { UpdateBaremeCommissionDto } from '../../dto/bareme-commission/update-bareme-commission.dto';

@Injectable()
export class UpdateBaremeCommissionUseCase {
  constructor(
    @Inject('BaremeCommissionRepositoryPort')
    private readonly repository: BaremeCommissionRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateBaremeCommissionDto,
  ): Promise<BaremeCommissionEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'BaremeCommission with id ' + id + ' not found',
      );
    }

    // Mise à jour simple (sans versioning)
    if (dto.code !== undefined) existing.code = dto.code;
    if (dto.nom !== undefined) existing.nom = dto.nom;
    if (dto.description !== undefined) existing.description = dto.description;
    if (dto.typeCalcul !== undefined)
      existing.typeCalcul = dto.typeCalcul as any;
    if (dto.baseCalcul !== undefined)
      existing.baseCalcul = dto.baseCalcul as any;
    if (dto.montantFixe !== undefined) existing.montantFixe = dto.montantFixe;
    if (dto.tauxPourcentage !== undefined)
      existing.tauxPourcentage = dto.tauxPourcentage;
    if (dto.precomptee !== undefined) existing.precomptee = dto.precomptee;
    if (dto.recurrenceActive !== undefined)
      existing.recurrenceActive = dto.recurrenceActive;
    if (dto.tauxRecurrence !== undefined)
      existing.tauxRecurrence = dto.tauxRecurrence;
    if (dto.dureeRecurrenceMois !== undefined)
      existing.dureeRecurrenceMois = dto.dureeRecurrenceMois;
    if (dto.dureeReprisesMois !== undefined)
      existing.dureeReprisesMois = dto.dureeReprisesMois;
    if (dto.tauxReprise !== undefined) existing.tauxReprise = dto.tauxReprise;
    if (dto.typeProduit !== undefined)
      existing.typeProduit = dto.typeProduit as any;
    if (dto.profilRemuneration !== undefined)
      existing.profilRemuneration = dto.profilRemuneration as any;
    if (dto.societeId !== undefined) existing.societeId = dto.societeId;
    if (dto.dateEffet !== undefined)
      existing.dateEffet = new Date(dto.dateEffet);
    if (dto.dateFin !== undefined)
      existing.dateFin = dto.dateFin ? new Date(dto.dateFin) : null;
    if (dto.modifiePar !== undefined) existing.modifiePar = dto.modifiePar;
    if (dto.motifModification !== undefined)
      existing.motifModification = dto.motifModification;

    existing.updatedAt = new Date();

    return await this.repository.update(id, existing);
  }

  async executeNouvelleVersion(
    id: string,
    dto: UpdateBaremeCommissionDto,
    modifiePar: string,
    motif: string,
  ): Promise<BaremeCommissionEntity> {
    return await this.repository.creerNouvelleVersion(
      id,
      dto as any,
      modifiePar,
      motif,
    );
  }
}
