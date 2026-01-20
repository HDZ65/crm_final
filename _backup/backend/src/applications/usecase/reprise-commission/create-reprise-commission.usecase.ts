import { Injectable, Inject } from '@nestjs/common';
import { RepriseCommissionEntity } from '../../../core/domain/reprise-commission.entity';
import type { RepriseCommissionRepositoryPort } from '../../../core/port/reprise-commission-repository.port';
import { CreateRepriseCommissionDto } from '../../dto/reprise-commission/create-reprise-commission.dto';

@Injectable()
export class CreateRepriseCommissionUseCase {
  constructor(
    @Inject('RepriseCommissionRepositoryPort')
    private readonly repository: RepriseCommissionRepositoryPort,
  ) {}

  async execute(
    dto: CreateRepriseCommissionDto,
  ): Promise<RepriseCommissionEntity> {
    const entity = new RepriseCommissionEntity({
      organisationId: dto.organisationId,
      commissionOriginaleId: dto.commissionOriginaleId,
      contratId: dto.contratId,
      apporteurId: dto.apporteurId,
      reference: dto.reference,
      typeReprise: dto.typeReprise as any,
      montantReprise: dto.montantReprise,
      tauxReprise: dto.tauxReprise ?? 100,
      montantOriginal: dto.montantOriginal,
      periodeOrigine: dto.periodeOrigine,
      periodeApplication: dto.periodeApplication,
      dateEvenement: new Date(dto.dateEvenement),
      dateLimite: new Date(dto.dateLimite),
      dateApplication: null,
      statutReprise: 'en_attente',
      bordereauId: null,
      motif: dto.motif ?? null,
      commentaire: dto.commentaire ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(entity);
  }
}
