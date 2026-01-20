import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CommissionEntity } from '../../../core/domain/commission.entity';
import type { CommissionRepositoryPort } from '../../../core/port/commission-repository.port';
import { UpdateCommissionDto } from '../../dto/commission/update-commission.dto';

@Injectable()
export class UpdateCommissionUseCase {
  constructor(
    @Inject('CommissionRepositoryPort')
    private readonly repository: CommissionRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateCommissionDto,
  ): Promise<CommissionEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Commission with id ' + id + ' not found');
    }

    if (dto.organisationId !== undefined) {
      existing.organisationId = dto.organisationId;
    }
    if (dto.reference !== undefined) {
      existing.reference = dto.reference;
    }
    if (dto.apporteurId !== undefined) {
      existing.apporteurId = dto.apporteurId;
    }
    if (dto.contratId !== undefined) {
      existing.contratId = dto.contratId;
    }
    if (dto.produitId !== undefined) {
      existing.produitId = dto.produitId;
    }
    if (dto.compagnie !== undefined) {
      existing.compagnie = dto.compagnie;
    }
    if (dto.typeBase !== undefined) {
      existing.typeBase = dto.typeBase;
    }
    if (dto.montantBrut !== undefined) {
      existing.montantBrut = dto.montantBrut;
    }
    if (dto.montantReprises !== undefined) {
      existing.montantReprises = dto.montantReprises;
    }
    if (dto.montantAcomptes !== undefined) {
      existing.montantAcomptes = dto.montantAcomptes;
    }
    if (dto.montantNetAPayer !== undefined) {
      existing.montantNetAPayer = dto.montantNetAPayer;
    }
    if (dto.statutId !== undefined) {
      existing.statutId = dto.statutId;
    }
    if (dto.periode !== undefined) {
      existing.periode = dto.periode;
    }
    if (dto.dateCreation !== undefined) {
      existing.dateCreation = new Date(dto.dateCreation);
    }
    existing.updatedAt = new Date();

    return await this.repository.update(id, existing);
  }
}
