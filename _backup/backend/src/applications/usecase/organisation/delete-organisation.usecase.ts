import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { OrganisationRepositoryPort } from '../../../core/port/organisation-repository.port';
import { MembreOrganisationEntity } from '../../../infrastructure/db/entities/membre-compte.entity';

@Injectable()
export class DeleteOrganisationUseCase {
  constructor(
    @Inject('OrganisationRepositoryPort')
    private readonly repository: OrganisationRepositoryPort,
    @InjectRepository(MembreOrganisationEntity)
    private readonly membreRepository: Repository<MembreOrganisationEntity>,
  ) {}

  async execute(id: string): Promise<void> {
    // Supprimer d'abord les membres de l'organisation
    await this.membreRepository.delete({ organisationId: id });
    // Puis supprimer l'organisation
    await this.repository.delete(id);
  }
}
