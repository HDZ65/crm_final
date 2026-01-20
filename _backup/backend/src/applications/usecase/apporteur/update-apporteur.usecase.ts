import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ApporteurEntity } from '../../../core/domain/apporteur.entity';
import type { ApporteurRepositoryPort } from '../../../core/port/apporteur-repository.port';
import { UpdateApporteurDto } from '../../dto/apporteur/update-apporteur.dto';

const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

@Injectable()
export class UpdateApporteurUseCase {
  constructor(
    @Inject('ApporteurRepositoryPort')
    private readonly repository: ApporteurRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateApporteurDto): Promise<ApporteurEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Apporteur with id ' + id + ' not found');
    }

    if (dto.organisationId !== undefined) {
      existing.organisationId = dto.organisationId;
    }
    if (dto.utilisateurId !== undefined) {
      existing.utilisateurId = dto.utilisateurId;
    }
    if (dto.nom !== undefined) {
      existing.nom = capitalize(dto.nom);
    }
    if (dto.prenom !== undefined) {
      existing.prenom = capitalize(dto.prenom);
    }
    if (dto.typeApporteur !== undefined) {
      existing.typeApporteur = dto.typeApporteur;
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

    return await this.repository.update(id, existing);
  }
}
