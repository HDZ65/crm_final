import { Injectable, Inject } from '@nestjs/common';
import { ColisEntity } from '../../../core/domain/colis.entity';
import type { ColisRepositoryPort } from '../../../core/port/colis-repository.port';
import { CreateColisDto } from '../../dto/colis/create-colis.dto';

@Injectable()
export class CreateColisUseCase {
  constructor(
    @Inject('ColisRepositoryPort')
    private readonly repository: ColisRepositoryPort,
  ) {}

  async execute(dto: CreateColisDto): Promise<ColisEntity> {
    const entity = new ColisEntity({
      expeditionId: dto.expeditionId,
      poidsGr: dto.poidsGr,
      longCm: dto.longCm,
      largCm: dto.largCm,
      hautCm: dto.hautCm,
      valeurDeclaree: dto.valeurDeclaree,
      contenu: dto.contenu,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}
