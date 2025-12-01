import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { FacturationParEntity } from '../../../core/domain/facturation-par.entity';
import type { FacturationParRepositoryPort } from '../../../core/port/facturation-par-repository.port';
import { UpdateFacturationParDto } from '../../dto/facturation-par/update-facturation-par.dto';

@Injectable()
export class UpdateFacturationParUseCase {
  constructor(
    @Inject('FacturationParRepositoryPort')
    private readonly repository: FacturationParRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateFacturationParDto,
  ): Promise<FacturationParEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'FacturationPar with id ' + id + ' not found',
      );
    }

    if (dto.code !== undefined) {
      existing.code = dto.code;
    }
    if (dto.nom !== undefined) {
      existing.nom = dto.nom;
    }
    if (dto.description !== undefined) {
      existing.description = dto.description;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}
