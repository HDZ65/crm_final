import { Injectable, Inject } from '@nestjs/common';
import { CommissionEntity } from '../../../core/domain/commission.entity';
import type { CommissionRepositoryPort } from '../../../core/port/commission-repository.port';
import { CreateCommissionDto } from '../../dto/commission/create-commission.dto';

@Injectable()
export class CreateCommissionUseCase {
  constructor(
    @Inject('CommissionRepositoryPort')
    private readonly repository: CommissionRepositoryPort,
  ) {}

  async execute(dto: CreateCommissionDto): Promise<CommissionEntity> {
    const entity = new CommissionEntity({
      organisationId: dto.organisationId,
      reference: dto.reference,
      apporteurId: dto.apporteurId,
      contratId: dto.contratId,
      produitId: dto.produitId ?? null,
      compagnie: dto.compagnie,
      typeBase: dto.typeBase,
      montantBrut: dto.montantBrut,
      montantReprises: dto.montantReprises ?? 0,
      montantAcomptes: dto.montantAcomptes ?? 0,
      montantNetAPayer: dto.montantNetAPayer,
      statutId: dto.statutId,
      periode: dto.periode,
      dateCreation: new Date(dto.dateCreation),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(entity);
  }
}
