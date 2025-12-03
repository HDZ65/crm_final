import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { TacheEntity, TacheType, TachePriorite, TacheStatut } from '../../../core/domain/tache.entity';
import type { TacheRepositoryPort } from '../../../core/port/tache-repository.port';
import { UpdateTacheDto } from '../../dto/tache/update-tache.dto';

@Injectable()
export class UpdateTacheUseCase {
  constructor(
    @Inject('TacheRepositoryPort')
    private readonly repository: TacheRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateTacheDto): Promise<TacheEntity> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Tâche avec l'id ${id} non trouvée`);
    }

    const updateData: Partial<TacheEntity> = {
      updatedAt: new Date(),
    };

    if (dto.titre !== undefined) updateData.titre = dto.titre;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.type !== undefined) updateData.type = dto.type as TacheType;
    if (dto.priorite !== undefined) updateData.priorite = dto.priorite as TachePriorite;
    if (dto.statut !== undefined) updateData.statut = dto.statut as TacheStatut;
    if (dto.dateEcheance !== undefined) updateData.dateEcheance = new Date(dto.dateEcheance);
    if (dto.dateCompletion !== undefined) updateData.dateCompletion = new Date(dto.dateCompletion);
    if (dto.assigneA !== undefined) updateData.assigneA = dto.assigneA;
    if (dto.clientId !== undefined) updateData.clientId = dto.clientId;
    if (dto.contratId !== undefined) updateData.contratId = dto.contratId;
    if (dto.factureId !== undefined) updateData.factureId = dto.factureId;
    if (dto.metadata !== undefined) updateData.metadata = dto.metadata;

    return await this.repository.update(id, updateData);
  }

  async marquerEnCours(id: string): Promise<TacheEntity> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Tâche avec l'id ${id} non trouvée`);
    }

    return await this.repository.update(id, {
      statut: 'EN_COURS',
      updatedAt: new Date(),
    });
  }

  async marquerTerminee(id: string): Promise<TacheEntity> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Tâche avec l'id ${id} non trouvée`);
    }

    return await this.repository.update(id, {
      statut: 'TERMINEE',
      dateCompletion: new Date(),
      updatedAt: new Date(),
    });
  }

  async marquerAnnulee(id: string): Promise<TacheEntity> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Tâche avec l'id ${id} non trouvée`);
    }

    return await this.repository.update(id, {
      statut: 'ANNULEE',
      updatedAt: new Date(),
    });
  }
}
