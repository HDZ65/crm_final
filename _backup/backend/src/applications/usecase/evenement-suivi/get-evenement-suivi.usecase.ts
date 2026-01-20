import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { EvenementSuiviEntity } from '../../../core/domain/evenement-suivi.entity';
import type { EvenementSuiviRepositoryPort } from '../../../core/port/evenement-suivi-repository.port';

@Injectable()
export class GetEvenementSuiviUseCase {
  constructor(
    @Inject('EvenementSuiviRepositoryPort')
    private readonly repository: EvenementSuiviRepositoryPort,
  ) {}

  async execute(id: string): Promise<EvenementSuiviEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(
        'EvenementSuivi with id ' + id + ' not found',
      );
    }

    return entity;
  }

  async executeAll(): Promise<EvenementSuiviEntity[]> {
    return await this.repository.findAll();
  }
}
