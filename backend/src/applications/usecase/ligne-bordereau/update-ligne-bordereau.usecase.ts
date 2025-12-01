import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { LigneBordereauEntity } from '../../../core/domain/ligne-bordereau.entity';
import type { LigneBordereauRepositoryPort } from '../../../core/port/ligne-bordereau-repository.port';
import { UpdateLigneBordereauDto } from '../../dto/ligne-bordereau/update-ligne-bordereau.dto';

@Injectable()
export class UpdateLigneBordereauUseCase {
  constructor(
    @Inject('LigneBordereauRepositoryPort')
    private readonly repository: LigneBordereauRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateLigneBordereauDto,
  ): Promise<LigneBordereauEntity> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('LigneBordereau not found');
    }

    if (dto.montantBrut !== undefined) existing.montantBrut = dto.montantBrut;
    if (dto.montantReprise !== undefined)
      existing.montantReprise = dto.montantReprise;
    if (dto.montantNet !== undefined) existing.montantNet = dto.montantNet;
    if (dto.statutLigne !== undefined)
      existing.statutLigne = dto.statutLigne as any;
    if (dto.selectionne !== undefined) existing.selectionne = dto.selectionne;
    if (dto.motifDeselection !== undefined)
      existing.motifDeselection = dto.motifDeselection;
    if (dto.ordre !== undefined) existing.ordre = dto.ordre;

    existing.updatedAt = new Date();
    return await this.repository.update(id, existing);
  }

  async executeSelectionner(id: string): Promise<LigneBordereauEntity> {
    return await this.repository.selectionnerLigne(id);
  }

  async executeDeselectionner(
    id: string,
    motif: string,
    validateurId: string,
  ): Promise<LigneBordereauEntity> {
    return await this.repository.deselectionnerLigne(id, motif, validateurId);
  }

  async executeValider(
    id: string,
    validateurId: string,
  ): Promise<LigneBordereauEntity> {
    return await this.repository.validerLigne(id, validateurId);
  }
}
