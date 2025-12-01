import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { AffectationGroupeClientEntity } from '../../../core/domain/affectation-groupe-client.entity';
import type { AffectationGroupeClientRepositoryPort } from '../../../core/port/affectation-groupe-client-repository.port';

@Injectable()
export class GetAffectationGroupeClientUseCase {
  constructor(
    @Inject('AffectationGroupeClientRepositoryPort')
    private readonly repository: AffectationGroupeClientRepositoryPort,
  ) {}

  async execute(id: string): Promise<AffectationGroupeClientEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(
        'AffectationGroupeClient with id ' + id + ' not found',
      );
    }

    return entity;
  }

  async executeAll(): Promise<AffectationGroupeClientEntity[]> {
    return await this.repository.findAll();
  }
}
