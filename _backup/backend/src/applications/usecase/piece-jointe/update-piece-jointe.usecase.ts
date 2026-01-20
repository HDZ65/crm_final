import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PieceJointeEntity } from '../../../core/domain/piece-jointe.entity';
import type { PieceJointeRepositoryPort } from '../../../core/port/piece-jointe-repository.port';
import { UpdatePieceJointeDto } from '../../dto/piece-jointe/update-piece-jointe.dto';

@Injectable()
export class UpdatePieceJointeUseCase {
  constructor(
    @Inject('PieceJointeRepositoryPort')
    private readonly repository: PieceJointeRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdatePieceJointeDto,
  ): Promise<PieceJointeEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('PieceJointe with id ' + id + ' not found');
    }

    if (dto.nomFichier !== undefined) {
      existing.nomFichier = dto.nomFichier;
    }
    if (dto.url !== undefined) {
      existing.url = dto.url;
    }
    if (dto.dateUpload !== undefined) {
      existing.dateUpload = dto.dateUpload;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}
