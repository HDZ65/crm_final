import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { FactureSettingsEntity } from '../../../core/domain/facture-settings.entity';
import type { FactureSettingsRepositoryPort } from '../../../core/port/facture-settings-repository.port';
import { UpdateFactureSettingsDto } from '../../dto/facture-settings/update-facture-settings.dto';

@Injectable()
export class UpdateFactureSettingsUseCase {
  constructor(
    @Inject('FactureSettingsRepositoryPort')
    private readonly repository: FactureSettingsRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateFactureSettingsDto): Promise<FactureSettingsEntity> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Paramètres de facturation non trouvés`);
    }

    return this.repository.update(id, dto as Partial<FactureSettingsEntity>);
  }

  async upsertBySocieteId(
    societeId: string,
    dto: UpdateFactureSettingsDto,
  ): Promise<FactureSettingsEntity> {
    const existing = await this.repository.findBySocieteId(societeId);

    if (existing) {
      return this.execute(existing.id, dto);
    }

    // Créer si n'existe pas
    const entity = new FactureSettingsEntity({
      societeId,
      primaryColor: dto.primaryColor || '#000000',
      showLogo: dto.showLogo ?? true,
      logoPosition: dto.logoPosition || 'left',
      ...dto,
    });

    return this.repository.create(entity);
  }
}
