import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { BoiteMailRepositoryPort } from '../../../core/port/boite-mail-repository.port';

@Injectable()
export class DeleteBoiteMailUseCase {
  constructor(
    @Inject('BoiteMailRepositoryPort')
    private readonly repository: BoiteMailRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(`BoiteMail with id ${id} not found`);
    }

    await this.repository.delete(id);
  }
}
