import { Injectable, Inject } from '@nestjs/common';
import { UtilisateurEntity } from '../../../core/domain/utilisateur.entity';
import type { UtilisateurRepositoryPort } from '../../../core/port/utilisateur-repository.port';
import { CreateUtilisateurDto } from '../../dto/utilisateur/create-utilisateur.dto';

@Injectable()
export class CreateUtilisateurUseCase {
  constructor(
    @Inject('UtilisateurRepositoryPort')
    private readonly repository: UtilisateurRepositoryPort,
  ) {}

  async execute(dto: CreateUtilisateurDto): Promise<UtilisateurEntity> {
    const entity = new UtilisateurEntity({
      keycloakId: dto.keycloakId || '',
      nom: dto.nom,
      prenom: dto.prenom,
      email: dto.email,
      telephone: dto.telephone,
      actif: dto.actif,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}
