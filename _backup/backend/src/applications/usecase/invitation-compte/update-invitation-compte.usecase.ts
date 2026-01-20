import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InvitationCompteEntity } from '../../../core/domain/invitation-compte.entity';
import type { InvitationCompteRepositoryPort } from '../../../core/port/invitation-compte-repository.port';
import { UpdateInvitationCompteDto } from '../../dto/invitation-compte/update-invitation-compte.dto';

@Injectable()
export class UpdateInvitationCompteUseCase {
  constructor(
    @Inject('InvitationCompteRepositoryPort')
    private readonly repository: InvitationCompteRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateInvitationCompteDto,
  ): Promise<InvitationCompteEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'InvitationCompte with id ' + id + ' not found',
      );
    }

    if (dto.organisationId !== undefined) {
      existing.organisationId = dto.organisationId;
    }
    if (dto.emailInvite !== undefined) {
      existing.emailInvite = dto.emailInvite;
    }
    if (dto.roleId !== undefined) {
      existing.roleId = dto.roleId;
    }
    if (dto.token !== undefined) {
      existing.token = dto.token;
    }
    if (dto.expireAt !== undefined) {
      existing.expireAt = dto.expireAt;
    }
    if (dto.etat !== undefined) {
      existing.etat = dto.etat;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}
