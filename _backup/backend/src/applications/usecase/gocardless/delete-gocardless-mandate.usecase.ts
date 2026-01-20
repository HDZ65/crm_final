import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { GoCardlessMandateRepositoryPort } from '../../../core/port/gocardless-mandate-repository.port';

@Injectable()
export class DeleteGoCardlessMandateUseCase {
  constructor(
    @Inject('GoCardlessMandateRepositoryPort')
    private readonly repository: GoCardlessMandateRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`GoCardless mandate with id ${id} not found`);
    }
    await this.repository.delete(id);
  }
}
