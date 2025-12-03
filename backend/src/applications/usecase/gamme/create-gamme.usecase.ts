import { Injectable, Inject } from '@nestjs/common';
import { GammeEntity } from '../../../core/domain/gamme.entity';
import type { GammeRepositoryPort } from '../../../core/port/gamme-repository.port';
import { CreateGammeDto } from '../../dto/gamme/create-gamme.dto';

@Injectable()
export class CreateGammeUseCase {
  constructor(
    @Inject('GammeRepositoryPort')
    private readonly repository: GammeRepositoryPort,
  ) {}

  async execute(dto: CreateGammeDto): Promise<GammeEntity> {
    const entity = new GammeEntity({
      societeId: dto.societeId,
      nom: dto.nom,
      description: dto.description,
      icone: dto.icone,
      actif: dto.actif,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(entity);
  }
}
