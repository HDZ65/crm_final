import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { LigneBordereauEntity } from '../../../core/domain/ligne-bordereau.entity';
import type { LigneBordereauRepositoryPort } from '../../../core/port/ligne-bordereau-repository.port';

@Injectable()
export class GetLigneBordereauUseCase {
  constructor(
    @Inject('LigneBordereauRepositoryPort')
    private readonly repository: LigneBordereauRepositoryPort,
  ) {}

  async execute(id: string): Promise<LigneBordereauEntity> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException('LigneBordereau not found');
    }
    return entity;
  }

  async executeByBordereauId(
    bordereauId: string,
  ): Promise<LigneBordereauEntity[]> {
    return await this.repository.findByBordereauId(bordereauId);
  }

  async executeSelectionnees(
    bordereauId: string,
  ): Promise<LigneBordereauEntity[]> {
    return await this.repository.findSelectionneesByBordereauId(bordereauId);
  }
}
