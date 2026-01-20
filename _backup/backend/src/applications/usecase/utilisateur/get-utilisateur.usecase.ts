import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { UtilisateurEntity } from '../../../core/domain/utilisateur.entity';
import type { UtilisateurRepositoryPort } from '../../../core/port/utilisateur-repository.port';

@Injectable()
export class GetUtilisateurUseCase {
  constructor(
    @Inject('UtilisateurRepositoryPort')
    private readonly repository: UtilisateurRepositoryPort,
  ) {}

  async execute(id: string): Promise<UtilisateurEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('Utilisateur with id ' + id + ' not found');
    }

    return entity;
  }

  async executeAll(): Promise<UtilisateurEntity[]> {
    return await this.repository.findAll();
  }
}
