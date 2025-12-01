import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PieceJointeEntity } from '../../../core/domain/piece-jointe.entity';
import type { PieceJointeRepositoryPort } from '../../../core/port/piece-jointe-repository.port';

@Injectable()
export class GetPieceJointeUseCase {
  constructor(
    @Inject('PieceJointeRepositoryPort')
    private readonly repository: PieceJointeRepositoryPort,
  ) {}

  async execute(id: string): Promise<PieceJointeEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('PieceJointe with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<PieceJointeEntity[]> {
    return await this.repository.findAll();
  }
}
