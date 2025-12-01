import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ClientEntrepriseRepositoryPort } from '../../../core/port/client-entreprise-repository.port';

@Injectable()
export class DeleteClientEntrepriseUseCase {
  constructor(
    @Inject('ClientEntrepriseRepositoryPort')
    private readonly repository: ClientEntrepriseRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'ClientEntreprise with id ' + id + ' not found',
      );
    }

    await this.repository.delete(id);
  }
}
