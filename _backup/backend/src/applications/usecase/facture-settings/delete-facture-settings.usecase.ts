import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { FactureSettingsRepositoryPort } from '../../../core/port/facture-settings-repository.port';

@Injectable()
export class DeleteFactureSettingsUseCase {
  constructor(
    @Inject('FactureSettingsRepositoryPort')
    private readonly repository: FactureSettingsRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Paramètres de facturation non trouvés`);
    }
    await this.repository.delete(id);
  }
}
