import { Injectable, Inject } from '@nestjs/common';
import { ApporteurEntity } from '../../../core/domain/apporteur.entity';
import type { ApporteurRepositoryPort } from '../../../core/port/apporteur-repository.port';
import { CreateApporteurDto } from '../../dto/apporteur/create-apporteur.dto';

const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

@Injectable()
export class CreateApporteurUseCase {
  constructor(
    @Inject('ApporteurRepositoryPort')
    private readonly repository: ApporteurRepositoryPort,
  ) {}

  async execute(dto: CreateApporteurDto): Promise<ApporteurEntity> {
    const entity = new ApporteurEntity({
      organisationId: dto.organisationId,
      utilisateurId: dto.utilisateurId ?? null,
      nom: dto.nom ? capitalize(dto.nom) : dto.nom,
      prenom: dto.prenom ? capitalize(dto.prenom) : dto.prenom,
      typeApporteur: dto.typeApporteur,
      email: dto.email ?? null,
      telephone: dto.telephone ?? null,
      actif: dto.actif ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(entity);
  }
}
