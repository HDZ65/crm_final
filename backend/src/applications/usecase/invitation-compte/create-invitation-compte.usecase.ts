import { Injectable, Inject } from '@nestjs/common';
import { InvitationCompteEntity } from '../../../core/domain/invitation-compte.entity';
import type { InvitationCompteRepositoryPort } from '../../../core/port/invitation-compte-repository.port';
import { CreateInvitationCompteDto } from '../../dto/invitation-compte/create-invitation-compte.dto';

@Injectable()
export class CreateInvitationCompteUseCase {
  constructor(
    @Inject('InvitationCompteRepositoryPort')
    private readonly repository: InvitationCompteRepositoryPort,
  ) {}

  async execute(
    dto: CreateInvitationCompteDto,
  ): Promise<InvitationCompteEntity> {
    const entity = new InvitationCompteEntity({
      organisationId: dto.organisationId,
      emailInvite: dto.emailInvite,
      roleId: dto.roleId,
      token: dto.token,
      expireAt: dto.expireAt,
      etat: dto.etat,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}
