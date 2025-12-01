import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InvitationCompteEntity } from '../../../core/domain/invitation-compte.entity';
import type { InvitationCompteRepositoryPort } from '../../../core/port/invitation-compte-repository.port';

@Injectable()
export class GetInvitationCompteUseCase {
  constructor(
    @Inject('InvitationCompteRepositoryPort')
    private readonly repository: InvitationCompteRepositoryPort,
  ) {}

  async execute(id: string): Promise<InvitationCompteEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(
        'InvitationCompte with id ' + id + ' not found',
      );
    }

    return entity;
  }

  async executeAll(): Promise<InvitationCompteEntity[]> {
    return await this.repository.findAll();
  }
}
