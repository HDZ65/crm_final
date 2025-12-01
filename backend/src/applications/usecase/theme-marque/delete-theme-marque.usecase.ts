import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ThemeMarqueRepositoryPort } from '../../../core/port/theme-marque-repository.port';

@Injectable()
export class DeleteThemeMarqueUseCase {
  constructor(
    @Inject('ThemeMarqueRepositoryPort')
    private readonly repository: ThemeMarqueRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('ThemeMarque with id ' + id + ' not found');
    }

    await this.repository.delete(id);
  }
}
