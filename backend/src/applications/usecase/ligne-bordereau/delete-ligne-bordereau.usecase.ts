import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { LigneBordereauRepositoryPort } from '../../../core/port/ligne-bordereau-repository.port';

@Injectable()
export class DeleteLigneBordereauUseCase {
  constructor(
    @Inject('LigneBordereauRepositoryPort')
    private readonly repository: LigneBordereauRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('LigneBordereau not found');
    }
    await this.repository.delete(id);
  }
}
