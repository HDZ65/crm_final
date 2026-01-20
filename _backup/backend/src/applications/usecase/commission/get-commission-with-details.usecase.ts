import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type {
  CommissionRepositoryPort,
  CommissionWithDetails,
} from '../../../core/port/commission-repository.port';

@Injectable()
export class GetCommissionWithDetailsUseCase {
  constructor(
    @Inject('CommissionRepositoryPort')
    private readonly repository: CommissionRepositoryPort,
  ) {}

  async executeAll(organisationId?: string): Promise<CommissionWithDetails[]> {
    return await this.repository.findAllWithDetails(organisationId);
  }

  async execute(id: string): Promise<CommissionWithDetails> {
    const result = await this.repository.findByIdWithDetails(id);

    if (!result) {
      throw new NotFoundException('Commission with id ' + id + ' not found');
    }

    return result;
  }
}
