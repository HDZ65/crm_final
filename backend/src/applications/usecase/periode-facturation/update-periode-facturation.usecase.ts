import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PeriodeFacturationEntity } from '../../../core/domain/periode-facturation.entity';
import type { PeriodeFacturationRepositoryPort } from '../../../core/port/periode-facturation-repository.port';
import { UpdatePeriodeFacturationDto } from '../../dto/periode-facturation/update-periode-facturation.dto';

@Injectable()
export class UpdatePeriodeFacturationUseCase {
  constructor(
    @Inject('PeriodeFacturationRepositoryPort')
    private readonly repository: PeriodeFacturationRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdatePeriodeFacturationDto,
  ): Promise<PeriodeFacturationEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'PeriodeFacturation with id ' + id + ' not found',
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
