import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { TypeActiviteEntity } from '../../../core/domain/type-activite.entity';
import type { TypeActiviteRepositoryPort } from '../../../core/port/type-activite-repository.port';

@Injectable()
export class GetTypeActiviteUseCase {
  constructor(
    @Inject('TypeActiviteRepositoryPort')
    private readonly repository: TypeActiviteRepositoryPort,
  ) {}

  async execute(id: string): Promise<TypeActiviteEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('TypeActivite with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<TypeActiviteEntity[]> {
    return await this.repository.findAll();
  }
}
