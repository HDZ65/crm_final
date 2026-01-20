import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { InvitationCompteRepositoryPort } from '../../../core/port/invitation-compte-repository.port';

@Injectable()
export class DeleteInvitationCompteUseCase {
  constructor(
    @Inject('InvitationCompteRepositoryPort')
    private readonly repository: InvitationCompteRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'InvitationCompte with id ' + id + ' not found',
      );
    }

    await this.repository.delete(id);
  }
}
