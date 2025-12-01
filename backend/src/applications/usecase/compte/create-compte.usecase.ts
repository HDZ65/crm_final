import { Injectable, Inject } from '@nestjs/common';
import { CompteEntity } from '../../../core/domain/compte.entity';
import type { CompteRepositoryPort } from '../../../core/port/compte-repository.port';
import { CreateCompteDto } from '../../dto/compte/create-compte.dto';

@Injectable()
export class CreateCompteUseCase {
  constructor(
    @Inject('CompteRepositoryPort')
    private readonly repository: CompteRepositoryPort,
  ) {}

  async execute(dto: CreateCompteDto): Promise<CompteEntity> {
    const entity = new CompteEntity({
      nom: dto.nom,
      etat: dto.etat || 'actif',
      dateCreation: dto.dateCreation || new Date().toISOString(),
      createdByUserId: dto.createdByUserId || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}
