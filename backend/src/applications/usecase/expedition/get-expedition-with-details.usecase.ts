import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type {
  ExpeditionRepositoryPort,
  ExpeditionWithDetails,
} from '../../../core/port/expedition-repository.port';

@Injectable()
export class GetExpeditionWithDetailsUseCase {
  constructor(
    @Inject('ExpeditionRepositoryPort')
    private readonly repository: ExpeditionRepositoryPort,
  ) {}

  async executeAll(organisationId?: string): Promise<ExpeditionWithDetails[]> {
    return await this.repository.findAllWithDetails(organisationId);
  }

  async execute(id: string): Promise<ExpeditionWithDetails> {
    const result = await this.repository.findByIdWithDetails(id);

    if (!result) {
      throw new NotFoundException('Expedition with id ' + id + ' not found');
    }

    return result;
  }
}
