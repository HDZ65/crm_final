import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ConditionPaiementEntity } from '../../../core/domain/condition-paiement.entity';
import type { ConditionPaiementRepositoryPort } from '../../../core/port/condition-paiement-repository.port';

@Injectable()
export class GetConditionPaiementUseCase {
  constructor(
    @Inject('ConditionPaiementRepositoryPort')
    private readonly repository: ConditionPaiementRepositoryPort,
  ) {}

  async execute(id: string): Promise<ConditionPaiementEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(
        'ConditionPaiement with id ' + id + ' not found',
      );
    }

    return entity;
  }

  async executeAll(): Promise<ConditionPaiementEntity[]> {
    return await this.repository.findAll();
  }
}
