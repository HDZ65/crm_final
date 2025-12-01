import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { BoiteMailEntity } from '../../../core/domain/boite-mail.entity';
import type { BoiteMailRepositoryPort } from '../../../core/port/boite-mail-repository.port';

@Injectable()
export class GetBoiteMailUseCase {
  constructor(
    @Inject('BoiteMailRepositoryPort')
    private readonly repository: BoiteMailRepositoryPort,
  ) {}

  async execute(id: string): Promise<BoiteMailEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(`BoiteMail with id ${id} not found`);
    }

    return entity;
  }

  async executeAll(): Promise<BoiteMailEntity[]> {
    return await this.repository.findAll();
  }

  async executeByUtilisateurId(
    utilisateurId: string,
  ): Promise<BoiteMailEntity[]> {
    return await this.repository.findByUtilisateurId(utilisateurId);
  }

  async executeDefaultByUtilisateurId(
    utilisateurId: string,
  ): Promise<BoiteMailEntity | null> {
    return await this.repository.findDefaultByUtilisateurId(utilisateurId);
  }
}
