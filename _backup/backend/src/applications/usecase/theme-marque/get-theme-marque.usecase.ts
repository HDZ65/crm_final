import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ThemeMarqueEntity } from '../../../core/domain/theme-marque.entity';
import type { ThemeMarqueRepositoryPort } from '../../../core/port/theme-marque-repository.port';

@Injectable()
export class GetThemeMarqueUseCase {
  constructor(
    @Inject('ThemeMarqueRepositoryPort')
    private readonly repository: ThemeMarqueRepositoryPort,
  ) {}

  async execute(id: string): Promise<ThemeMarqueEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('ThemeMarque with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<ThemeMarqueEntity[]> {
    return await this.repository.findAll();
  }
}
