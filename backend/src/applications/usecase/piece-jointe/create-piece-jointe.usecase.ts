import { Injectable, Inject } from '@nestjs/common';
import { PieceJointeEntity } from '../../../core/domain/piece-jointe.entity';
import type { PieceJointeRepositoryPort } from '../../../core/port/piece-jointe-repository.port';
import { CreatePieceJointeDto } from '../../dto/piece-jointe/create-piece-jointe.dto';

@Injectable()
export class CreatePieceJointeUseCase {
  constructor(
    @Inject('PieceJointeRepositoryPort')
    private readonly repository: PieceJointeRepositoryPort,
  ) {}

  async execute(dto: CreatePieceJointeDto): Promise<PieceJointeEntity> {
    const entity = new PieceJointeEntity({
      nomFichier: dto.nomFichier,
      url: dto.url,
      dateUpload: dto.dateUpload,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}
