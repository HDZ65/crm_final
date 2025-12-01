import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CompteEntity } from '../../../core/domain/compte.entity';
import type { CompteRepositoryPort } from '../../../core/port/compte-repository.port';
import { UpdateCompteDto } from '../../dto/compte/update-compte.dto';

@Injectable()
export class UpdateCompteUseCase {
  constructor(
    @Inject('CompteRepositoryPort')
    private readonly repository: CompteRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateCompteDto): Promise<CompteEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Compte with id ' + id + ' not found');
    }

    if (dto.nom !== undefined) {
      existing.nom = dto.nom;
    }
    if (dto.etat !== undefined) {
      existing.etat = dto.etat;
    }
    if (dto.dateCreation !== undefined) {
      existing.dateCreation = dto.dateCreation;
    }
    if (dto.createdByUserId !== undefined) {
      existing.createdByUserId = dto.createdByUserId;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}
