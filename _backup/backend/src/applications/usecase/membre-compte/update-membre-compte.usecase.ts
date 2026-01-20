import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { MembreCompteEntity } from '../../../core/domain/membre-compte.entity';
import type { MembreCompteRepositoryPort } from '../../../core/port/membre-compte-repository.port';
import { UpdateMembreCompteDto } from '../../dto/membre-compte/update-membre-compte.dto';

@Injectable()
export class UpdateMembreCompteUseCase {
  constructor(
    @Inject('MembreCompteRepositoryPort')
    private readonly repository: MembreCompteRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateMembreCompteDto,
  ): Promise<MembreCompteEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('MembreCompte with id ' + id + ' not found');
    }

    if (dto.organisationId !== undefined) {
      existing.organisationId = dto.organisationId;
    }
    if (dto.utilisateurId !== undefined) {
      existing.utilisateurId = dto.utilisateurId;
    }
    if (dto.roleId !== undefined) {
      existing.roleId = dto.roleId;
    }
    if (dto.etat !== undefined) {
      existing.etat = dto.etat;
    }
    if (dto.dateInvitation !== undefined) {
      existing.dateInvitation =
        dto.dateInvitation === null ? null : new Date(dto.dateInvitation);
    }
    if (dto.dateActivation !== undefined) {
      existing.dateActivation =
        dto.dateActivation === null ? null : new Date(dto.dateActivation);
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}
