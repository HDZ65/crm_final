import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { FactureSettingsEntity } from '../../../core/domain/facture-settings.entity';
import type { FactureSettingsRepositoryPort } from '../../../core/port/facture-settings-repository.port';

@Injectable()
export class GetFactureSettingsUseCase {
  constructor(
    @Inject('FactureSettingsRepositoryPort')
    private readonly repository: FactureSettingsRepositoryPort,
  ) {}

  async execute(id: string): Promise<FactureSettingsEntity> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Paramètres de facturation non trouvés`);
    }
    return entity;
  }

  async findBySocieteId(societeId: string): Promise<FactureSettingsEntity | null> {
    return this.repository.findBySocieteId(societeId);
  }

  async findAll(): Promise<FactureSettingsEntity[]> {
    return this.repository.findAll();
  }
}
