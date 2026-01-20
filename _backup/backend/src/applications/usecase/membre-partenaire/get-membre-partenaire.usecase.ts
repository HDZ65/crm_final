import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { MembrePartenaireEntity } from '../../../core/domain/membre-partenaire.entity';
import type { MembrePartenaireRepositoryPort } from '../../../core/port/membre-partenaire-repository.port';

@Injectable()
export class GetMembrePartenaireUseCase {
  constructor(
    @Inject('MembrePartenaireRepositoryPort')
    private readonly repository: MembrePartenaireRepositoryPort,
  ) {}

  async execute(id: string): Promise<MembrePartenaireEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(
        'MembrePartenaire with id ' + id + ' not found',
      );
    }

    return entity;
  }

  async executeAll(): Promise<MembrePartenaireEntity[]> {
    return await this.repository.findAll();
  }
}
