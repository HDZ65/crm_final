import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ContratEntity } from '../../../core/domain/contrat.entity';
import type { ContratRepositoryPort } from '../../../core/port/contrat-repository.port';

@Injectable()
export class GetContratUseCase {
  constructor(
    @Inject('ContratRepositoryPort')
    private readonly repository: ContratRepositoryPort,
  ) {}

  async execute(id: string): Promise<ContratEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('Contrat with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<ContratEntity[]> {
    return await this.repository.findAll();
  }
}
