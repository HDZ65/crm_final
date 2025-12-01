import { Injectable, Inject } from '@nestjs/common';
import { ActiviteEntity } from '../../../core/domain/activite.entity';
import type { ActiviteRepositoryPort } from '../../../core/port/activite-repository.port';
import { CreateActiviteDto } from '../../dto/activite/create-activite.dto';

@Injectable()
export class CreateActiviteUseCase {
  constructor(
    @Inject('ActiviteRepositoryPort')
    private readonly repository: ActiviteRepositoryPort,
  ) {}

  async execute(dto: CreateActiviteDto): Promise<ActiviteEntity> {
    const entity = new ActiviteEntity({
      typeId: dto.typeId,
      dateActivite: dto.dateActivite,
      sujet: dto.sujet,
      commentaire: dto.commentaire,
      echeance: dto.echeance,
      clientBaseId: dto.clientBaseId,
      contratId: dto.contratId,
      clientPartenaireId: dto.clientPartenaireId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}
