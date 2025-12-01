import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { StatutCommissionEntity } from '../../../core/domain/statut-commission.entity';
import type { StatutCommissionRepositoryPort } from '../../../core/port/statut-commission-repository.port';

@Injectable()
export class GetStatutCommissionUseCase {
  constructor(
    @Inject('StatutCommissionRepositoryPort')
    private readonly repository: StatutCommissionRepositoryPort,
  ) {}

  async execute(id: string): Promise<StatutCommissionEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(
        'StatutCommission with id ' + id + ' not found',
      );
    }

    return entity;
  }

  async executeAll(): Promise<StatutCommissionEntity[]> {
    return await this.repository.findAll();
  }
}
