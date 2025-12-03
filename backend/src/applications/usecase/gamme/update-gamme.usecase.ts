import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { GammeEntity } from '../../../core/domain/gamme.entity';
import type { GammeRepositoryPort } from '../../../core/port/gamme-repository.port';
import { UpdateGammeDto } from '../../dto/gamme/update-gamme.dto';

@Injectable()
export class UpdateGammeUseCase {
  constructor(
    @Inject('GammeRepositoryPort')
    private readonly repository: GammeRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateGammeDto): Promise<GammeEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Gamme with id ' + id + ' not found');
    }

    const updated = new GammeEntity({
      ...existing,
      nom: dto.nom ?? existing.nom,
      description: dto.description ?? existing.description,
      icone: dto.icone ?? existing.icone,
      actif: dto.actif ?? existing.actif,
      updatedAt: new Date(),
    });

    return await this.repository.update(id, updated);
  }
}
