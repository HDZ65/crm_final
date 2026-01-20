import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ColisEntity } from '../../../core/domain/colis.entity';
import type { ColisRepositoryPort } from '../../../core/port/colis-repository.port';
import { UpdateColisDto } from '../../dto/colis/update-colis.dto';

@Injectable()
export class UpdateColisUseCase {
  constructor(
    @Inject('ColisRepositoryPort')
    private readonly repository: ColisRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateColisDto): Promise<ColisEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Colis with id ' + id + ' not found');
    }

    if (dto.expeditionId !== undefined) {
      existing.expeditionId = dto.expeditionId;
    }
    if (dto.poidsGr !== undefined) {
      existing.poidsGr = dto.poidsGr;
    }
    if (dto.longCm !== undefined) {
      existing.longCm = dto.longCm;
    }
    if (dto.largCm !== undefined) {
      existing.largCm = dto.largCm;
    }
    if (dto.hautCm !== undefined) {
      existing.hautCm = dto.hautCm;
    }
    if (dto.valeurDeclaree !== undefined) {
      existing.valeurDeclaree = dto.valeurDeclaree;
    }
    if (dto.contenu !== undefined) {
      existing.contenu = dto.contenu;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}
