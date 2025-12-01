import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { UtilisateurEntity } from '../../../core/domain/utilisateur.entity';
import type { UtilisateurRepositoryPort } from '../../../core/port/utilisateur-repository.port';
import { UpdateUtilisateurDto } from '../../dto/utilisateur/update-utilisateur.dto';

@Injectable()
export class UpdateUtilisateurUseCase {
  constructor(
    @Inject('UtilisateurRepositoryPort')
    private readonly repository: UtilisateurRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateUtilisateurDto,
  ): Promise<UtilisateurEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Utilisateur with id ' + id + ' not found');
    }

    if (dto.nom !== undefined) {
      existing.nom = dto.nom;
    }
    if (dto.prenom !== undefined) {
      existing.prenom = dto.prenom;
    }
    if (dto.email !== undefined) {
      existing.email = dto.email;
    }
    if (dto.telephone !== undefined) {
      existing.telephone = dto.telephone;
    }
    if (dto.actif !== undefined) {
      existing.actif = dto.actif;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}
