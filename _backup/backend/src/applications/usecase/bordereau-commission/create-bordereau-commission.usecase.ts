import { Injectable, Inject } from '@nestjs/common';
import { BordereauCommissionEntity } from '../../../core/domain/bordereau-commission.entity';
import type { BordereauCommissionRepositoryPort } from '../../../core/port/bordereau-commission-repository.port';
import { CreateBordereauCommissionDto } from '../../dto/bordereau-commission/create-bordereau-commission.dto';

@Injectable()
export class CreateBordereauCommissionUseCase {
  constructor(
    @Inject('BordereauCommissionRepositoryPort')
    private readonly repository: BordereauCommissionRepositoryPort,
  ) {}

  async execute(
    dto: CreateBordereauCommissionDto,
  ): Promise<BordereauCommissionEntity> {
    const entity = new BordereauCommissionEntity({
      organisationId: dto.organisationId,
      reference: dto.reference,
      periode: dto.periode,
      apporteurId: dto.apporteurId,
      totalBrut: 0,
      totalReprises: 0,
      totalAcomptes: 0,
      totalNetAPayer: 0,
      nombreLignes: 0,
      statutBordereau: 'brouillon',
      dateValidation: null,
      validateurId: null,
      dateExport: null,
      fichierPdfUrl: null,
      fichierExcelUrl: null,
      commentaire: dto.commentaire ?? null,
      creePar: dto.creePar ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(entity);
  }
}
