import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { ClientBaseEntity } from '../../../core/domain/client-base.entity';
import type { ClientBaseRepositoryPort } from '../../../core/port/client-base-repository.port';
import { CreateClientBaseDto } from '../../dto/client-base/create-client-base.dto';

@Injectable()
export class CreateClientBaseUseCase {
  constructor(
    @Inject('ClientBaseRepositoryPort')
    private readonly repository: ClientBaseRepositoryPort,
  ) {}

  async execute(dto: CreateClientBaseDto): Promise<ClientBaseEntity> {
    const existingClient = await this.repository.findByPhoneAndName(
      dto.telephone,
      dto.nom,
    );
    if (existingClient) {
      throw new ConflictException(
        'Un client avec le nom ' +
          dto.nom +
          ' et le telephone ' +
          dto.telephone +
          ' existe deja.',
      );
    }

    const entity = new ClientBaseEntity({
      organisationId: dto.organisationId,
      typeClient: dto.typeClient,
      nom: dto.nom,
      prenom: dto.prenom,
      dateNaissance: dto.dateNaissance ? new Date(dto.dateNaissance) : null,
      compteCode: dto.compteCode,
      partenaireId: dto.partenaireId,
      dateCreation: new Date(dto.dateCreation),
      telephone: dto.telephone,
      statutId: dto.statutId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(entity);
  }
}
