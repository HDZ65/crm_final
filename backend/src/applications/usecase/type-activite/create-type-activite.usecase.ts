import { Injectable, Inject } from '@nestjs/common';
import { TypeActiviteEntity } from '../../../core/domain/type-activite.entity';
import type { TypeActiviteRepositoryPort } from '../../../core/port/type-activite-repository.port';
import { CreateTypeActiviteDto } from '../../dto/type-activite/create-type-activite.dto';

@Injectable()
export class CreateTypeActiviteUseCase {
  constructor(
    @Inject('TypeActiviteRepositoryPort')
    private readonly repository: TypeActiviteRepositoryPort,
  ) {}

  async execute(dto: CreateTypeActiviteDto): Promise<TypeActiviteEntity> {
    const entity = new TypeActiviteEntity({
      code: dto.code,
      nom: dto.nom,
      description: dto.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}
