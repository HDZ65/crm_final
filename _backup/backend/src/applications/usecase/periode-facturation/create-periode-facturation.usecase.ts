import { Injectable, Inject } from '@nestjs/common';
import { PeriodeFacturationEntity } from '../../../core/domain/periode-facturation.entity';
import type { PeriodeFacturationRepositoryPort } from '../../../core/port/periode-facturation-repository.port';
import { CreatePeriodeFacturationDto } from '../../dto/periode-facturation/create-periode-facturation.dto';

@Injectable()
export class CreatePeriodeFacturationUseCase {
  constructor(
    @Inject('PeriodeFacturationRepositoryPort')
    private readonly repository: PeriodeFacturationRepositoryPort,
  ) {}

  async execute(
    dto: CreatePeriodeFacturationDto,
  ): Promise<PeriodeFacturationEntity> {
    const entity = new PeriodeFacturationEntity({
      code: dto.code,
      nom: dto.nom,
      description: dto.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}
