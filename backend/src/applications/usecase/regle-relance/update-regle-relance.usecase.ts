import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { RegleRelanceEntity, RelanceDeclencheur, RelanceActionType } from '../../../core/domain/regle-relance.entity';
import type { RegleRelanceRepositoryPort } from '../../../core/port/regle-relance-repository.port';
import { UpdateRegleRelanceDto } from '../../dto/regle-relance/update-regle-relance.dto';

@Injectable()
export class UpdateRegleRelanceUseCase {
  constructor(
    @Inject('RegleRelanceRepositoryPort')
    private readonly repository: RegleRelanceRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateRegleRelanceDto): Promise<RegleRelanceEntity> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Règle de relance avec l'id ${id} non trouvée`);
    }

    const updateData: Partial<RegleRelanceEntity> = {
      updatedAt: new Date(),
    };

    if (dto.nom !== undefined) updateData.nom = dto.nom;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.declencheur !== undefined) updateData.declencheur = dto.declencheur as RelanceDeclencheur;
    if (dto.delaiJours !== undefined) updateData.delaiJours = dto.delaiJours;
    if (dto.actionType !== undefined) updateData.actionType = dto.actionType as RelanceActionType;
    if (dto.prioriteTache !== undefined) updateData.prioriteTache = dto.prioriteTache as 'HAUTE' | 'MOYENNE' | 'BASSE';
    if (dto.templateEmailId !== undefined) updateData.templateEmailId = dto.templateEmailId;
    if (dto.templateTitreTache !== undefined) updateData.templateTitreTache = dto.templateTitreTache;
    if (dto.templateDescriptionTache !== undefined) updateData.templateDescriptionTache = dto.templateDescriptionTache;
    if (dto.assigneParDefaut !== undefined) updateData.assigneParDefaut = dto.assigneParDefaut;
    if (dto.actif !== undefined) updateData.actif = dto.actif;
    if (dto.ordre !== undefined) updateData.ordre = dto.ordre;
    if (dto.metadata !== undefined) updateData.metadata = dto.metadata;

    return await this.repository.update(id, updateData);
  }

  async activer(id: string): Promise<RegleRelanceEntity> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Règle de relance avec l'id ${id} non trouvée`);
    }

    return await this.repository.update(id, {
      actif: true,
      updatedAt: new Date(),
    });
  }

  async desactiver(id: string): Promise<RegleRelanceEntity> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Règle de relance avec l'id ${id} non trouvée`);
    }

    return await this.repository.update(id, {
      actif: false,
      updatedAt: new Date(),
    });
  }
}
