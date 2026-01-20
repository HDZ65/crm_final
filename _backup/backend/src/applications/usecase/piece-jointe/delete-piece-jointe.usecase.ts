import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { PieceJointeRepositoryPort } from '../../../core/port/piece-jointe-repository.port';

@Injectable()
export class DeletePieceJointeUseCase {
  constructor(
    @Inject('PieceJointeRepositoryPort')
    private readonly repository: PieceJointeRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('PieceJointe with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}
