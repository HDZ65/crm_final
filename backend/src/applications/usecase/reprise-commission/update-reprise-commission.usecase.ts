import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { RepriseCommissionEntity } from '../../../core/domain/reprise-commission.entity';
import type { RepriseCommissionRepositoryPort } from '../../../core/port/reprise-commission-repository.port';
import { UpdateRepriseCommissionDto } from '../../dto/reprise-commission/update-reprise-commission.dto';

@Injectable()
export class UpdateRepriseCommissionUseCase {
  constructor(
    @Inject('RepriseCommissionRepositoryPort')
    private readonly repository: RepriseCommissionRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateRepriseCommissionDto,
  ): Promise<RepriseCommissionEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('RepriseCommission with id ' + id + ' not found');
    }

    if (dto.typeReprise !== undefined)
      existing.typeReprise = dto.typeReprise as any;
    if (dto.montantReprise !== undefined)
      existing.montantReprise = dto.montantReprise;
    if (dto.tauxReprise !== undefined) existing.tauxReprise = dto.tauxReprise;
    if (dto.periodeApplication !== undefined)
      existing.periodeApplication = dto.periodeApplication;
    if (dto.statutReprise !== undefined)
      existing.statutReprise = dto.statutReprise as any;
    if (dto.dateApplication !== undefined)
      existing.dateApplication = dto.dateApplication
        ? new Date(dto.dateApplication)
        : null;
    if (dto.bordereauId !== undefined) existing.bordereauId = dto.bordereauId;
    if (dto.motif !== undefined) existing.motif = dto.motif;
    if (dto.commentaire !== undefined) existing.commentaire = dto.commentaire;

    existing.updatedAt = new Date();

    return await this.repository.update(id, existing);
  }

  async executeAppliquer(
    id: string,
    bordereauId: string,
  ): Promise<RepriseCommissionEntity> {
    return await this.repository.appliquerReprise(id, bordereauId);
  }

  async executeAnnuler(
    id: string,
    motif: string,
  ): Promise<RepriseCommissionEntity> {
    return await this.repository.annulerReprise(id, motif);
  }
}
