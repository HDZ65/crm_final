import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ClientBaseEntity } from '../../../core/domain/client-base.entity';
import type { ClientBaseRepositoryPort } from '../../../core/port/client-base-repository.port';
import { UpdateClientBaseDto } from '../../dto/client-base/update-client-base.dto';

@Injectable()
export class UpdateClientBaseUseCase {
  constructor(
    @Inject('ClientBaseRepositoryPort')
    private readonly repository: ClientBaseRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateClientBaseDto,
  ): Promise<ClientBaseEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`ClientBase avec l'id ${id} n'existe pas.`);
    }

    // Update entity with new values
    if (dto.typeClient !== undefined) {
      existing.typeClient = dto.typeClient;
    }
    if (dto.organisationId !== undefined) {
      existing.organisationId = dto.organisationId;
    }
    if (dto.nom !== undefined) {
      existing.nom = dto.nom;
    }
    if (dto.prenom !== undefined) {
      existing.prenom = dto.prenom;
    }
    if (dto.dateNaissance !== undefined) {
      existing.dateNaissance =
        dto.dateNaissance === null ? null : new Date(dto.dateNaissance);
    }
    if (dto.compteCode !== undefined) {
      existing.compteCode = dto.compteCode;
    }
    if (dto.partenaireId !== undefined) {
      existing.partenaireId = dto.partenaireId;
    }
    if (dto.dateCreation !== undefined) {
      existing.dateCreation = new Date(dto.dateCreation);
    }
    if (dto.telephone !== undefined) {
      existing.telephone = dto.telephone;
    }
    if (dto.statutId !== undefined) {
      existing.statutId = dto.statutId;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}
