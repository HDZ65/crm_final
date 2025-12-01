import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { BordereauCommissionEntity } from '../../../core/domain/bordereau-commission.entity';
import type { BordereauCommissionRepositoryPort } from '../../../core/port/bordereau-commission-repository.port';
import { UpdateBordereauCommissionDto } from '../../dto/bordereau-commission/update-bordereau-commission.dto';

@Injectable()
export class UpdateBordereauCommissionUseCase {
  constructor(
    @Inject('BordereauCommissionRepositoryPort')
    private readonly repository: BordereauCommissionRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateBordereauCommissionDto,
  ): Promise<BordereauCommissionEntity> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('BordereauCommission not found');
    }

    if (dto.commentaire !== undefined) existing.commentaire = dto.commentaire;
    if (dto.statutBordereau !== undefined)
      existing.statutBordereau = dto.statutBordereau as any;
    if (dto.totalBrut !== undefined) existing.totalBrut = dto.totalBrut;
    if (dto.totalReprises !== undefined)
      existing.totalReprises = dto.totalReprises;
    if (dto.totalAcomptes !== undefined)
      existing.totalAcomptes = dto.totalAcomptes;
    if (dto.totalNetAPayer !== undefined)
      existing.totalNetAPayer = dto.totalNetAPayer;
    if (dto.nombreLignes !== undefined) existing.nombreLignes = dto.nombreLignes;
    if (dto.fichierPdfUrl !== undefined)
      existing.fichierPdfUrl = dto.fichierPdfUrl;
    if (dto.fichierExcelUrl !== undefined)
      existing.fichierExcelUrl = dto.fichierExcelUrl;

    existing.updatedAt = new Date();
    return await this.repository.update(id, existing);
  }

  async executeValider(
    id: string,
    validateurId: string,
  ): Promise<BordereauCommissionEntity> {
    return await this.repository.validerBordereau(id, validateurId);
  }

  async executeExporter(
    id: string,
    pdfUrl: string | null,
    excelUrl: string | null,
  ): Promise<BordereauCommissionEntity> {
    return await this.repository.exporterBordereau(id, pdfUrl, excelUrl);
  }

  async executeRecalculerTotaux(id: string): Promise<BordereauCommissionEntity> {
    return await this.repository.recalculerTotaux(id);
  }
}
