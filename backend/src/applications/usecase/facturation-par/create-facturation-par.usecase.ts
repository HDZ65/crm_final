import { Injectable, Inject } from '@nestjs/common';
import { FacturationParEntity } from '../../../core/domain/facturation-par.entity';
import type { FacturationParRepositoryPort } from '../../../core/port/facturation-par-repository.port';
import { CreateFacturationParDto } from '../../dto/facturation-par/create-facturation-par.dto';

@Injectable()
export class CreateFacturationParUseCase {
  constructor(
    @Inject('FacturationParRepositoryPort')
    private readonly repository: FacturationParRepositoryPort,
  ) {}

  async execute(dto: CreateFacturationParDto): Promise<FacturationParEntity> {
    const entity = new FacturationParEntity({
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
