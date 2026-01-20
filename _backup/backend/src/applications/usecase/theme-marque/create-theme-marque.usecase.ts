import { Injectable, Inject } from '@nestjs/common';
import { ThemeMarqueEntity } from '../../../core/domain/theme-marque.entity';
import type { ThemeMarqueRepositoryPort } from '../../../core/port/theme-marque-repository.port';
import { CreateThemeMarqueDto } from '../../dto/theme-marque/create-theme-marque.dto';

@Injectable()
export class CreateThemeMarqueUseCase {
  constructor(
    @Inject('ThemeMarqueRepositoryPort')
    private readonly repository: ThemeMarqueRepositoryPort,
  ) {}

  async execute(dto: CreateThemeMarqueDto): Promise<ThemeMarqueEntity> {
    const entity = new ThemeMarqueEntity({
      logoUrl: dto.logoUrl,
      couleurPrimaire: dto.couleurPrimaire,
      couleurSecondaire: dto.couleurSecondaire,
      faviconUrl: dto.faviconUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}
