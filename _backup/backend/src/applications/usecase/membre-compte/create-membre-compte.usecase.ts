import { Injectable, Inject } from '@nestjs/common';
import { MembreCompteEntity } from '../../../core/domain/membre-compte.entity';
import type { MembreCompteRepositoryPort } from '../../../core/port/membre-compte-repository.port';
import { CreateMembreCompteDto } from '../../dto/membre-compte/create-membre-compte.dto';

@Injectable()
export class CreateMembreCompteUseCase {
  constructor(
    @Inject('MembreCompteRepositoryPort')
    private readonly repository: MembreCompteRepositoryPort,
  ) {}

  async execute(dto: CreateMembreCompteDto): Promise<MembreCompteEntity> {
    const entity = new MembreCompteEntity({
      organisationId: dto.organisationId,
      utilisateurId: dto.utilisateurId,
      roleId: dto.roleId,
      etat: dto.etat,
      dateInvitation: dto.dateInvitation ? new Date(dto.dateInvitation) : null,
      dateActivation: dto.dateActivation ? new Date(dto.dateActivation) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}
