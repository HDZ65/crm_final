import { Injectable, Inject } from '@nestjs/common';
import { ApporteurEntity } from '../../../core/domain/apporteur.entity';
import type { ApporteurRepositoryPort } from '../../../core/port/apporteur-repository.port';
import { CreateApporteurDto } from '../../dto/apporteur/create-apporteur.dto';

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
      nom: dto.nom,
      prenom: dto.prenom,
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
