import { Injectable, Inject } from '@nestjs/common';
import { RegleRelanceEntity, RelanceDeclencheur, RelanceActionType } from '../../../core/domain/regle-relance.entity';
import type { RegleRelanceRepositoryPort } from '../../../core/port/regle-relance-repository.port';
import { CreateRegleRelanceDto } from '../../dto/regle-relance/create-regle-relance.dto';

@Injectable()
export class CreateRegleRelanceUseCase {
  constructor(
    @Inject('RegleRelanceRepositoryPort')
    private readonly repository: RegleRelanceRepositoryPort,
  ) {}

  async execute(dto: CreateRegleRelanceDto): Promise<RegleRelanceEntity> {
    const entity = new RegleRelanceEntity({
      organisationId: dto.organisationId,
      nom: dto.nom,
      description: dto.description,
      declencheur: dto.declencheur as RelanceDeclencheur,
      delaiJours: dto.delaiJours,
      actionType: dto.actionType as RelanceActionType,
      prioriteTache: (dto.prioriteTache as 'HAUTE' | 'MOYENNE' | 'BASSE') ?? 'MOYENNE',
      templateEmailId: dto.templateEmailId,
      templateTitreTache: dto.templateTitreTache,
      templateDescriptionTache: dto.templateDescriptionTache,
      assigneParDefaut: dto.assigneParDefaut,
      actif: dto.actif ?? true,
      ordre: dto.ordre ?? 1,
      metadata: dto.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(entity);
  }
}
