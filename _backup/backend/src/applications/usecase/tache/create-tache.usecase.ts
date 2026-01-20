import { Injectable, Inject } from '@nestjs/common';
import {
  TacheEntity,
  TacheType,
  TachePriorite,
  TacheStatut,
} from '../../../core/domain/tache.entity';
import type { TacheRepositoryPort } from '../../../core/port/tache-repository.port';
import { CreateTacheDto } from '../../dto/tache/create-tache.dto';

@Injectable()
export class CreateTacheUseCase {
  constructor(
    @Inject('TacheRepositoryPort')
    private readonly repository: TacheRepositoryPort,
  ) {}

  async execute(dto: CreateTacheDto): Promise<TacheEntity> {
    const entity = new TacheEntity({
      organisationId: dto.organisationId,
      titre: dto.titre,
      description: dto.description,
      type: dto.type as TacheType,
      priorite: dto.priorite as TachePriorite,
      statut: (dto.statut as TacheStatut) ?? 'A_FAIRE',
      dateEcheance: new Date(dto.dateEcheance),
      assigneA: dto.assigneA,
      creePar: dto.creePar,
      clientId: dto.clientId,
      contratId: dto.contratId,
      factureId: dto.factureId,
      regleRelanceId: dto.regleRelanceId,
      metadata: dto.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(entity);
  }
}
