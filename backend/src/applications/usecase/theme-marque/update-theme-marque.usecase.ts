import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ThemeMarqueEntity } from '../../../core/domain/theme-marque.entity';
import type { ThemeMarqueRepositoryPort } from '../../../core/port/theme-marque-repository.port';
import { UpdateThemeMarqueDto } from '../../dto/theme-marque/update-theme-marque.dto';

@Injectable()
export class UpdateThemeMarqueUseCase {
  constructor(
    @Inject('ThemeMarqueRepositoryPort')
    private readonly repository: ThemeMarqueRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateThemeMarqueDto,
  ): Promise<ThemeMarqueEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('ThemeMarque with id ' + id + ' not found');
    }

    if (dto.logoUrl !== undefined) {
      existing.logoUrl = dto.logoUrl;
    }
    if (dto.couleurPrimaire !== undefined) {
      existing.couleurPrimaire = dto.couleurPrimaire;
    }
    if (dto.couleurSecondaire !== undefined) {
      existing.couleurSecondaire = dto.couleurSecondaire;
    }
    if (dto.faviconUrl !== undefined) {
      existing.faviconUrl = dto.faviconUrl;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}
