import { Injectable, Inject } from '@nestjs/common';
import { LigneBordereauEntity } from '../../../core/domain/ligne-bordereau.entity';
import type { LigneBordereauRepositoryPort } from '../../../core/port/ligne-bordereau-repository.port';
import { CreateLigneBordereauDto } from '../../dto/ligne-bordereau/create-ligne-bordereau.dto';

@Injectable()
export class CreateLigneBordereauUseCase {
  constructor(
    @Inject('LigneBordereauRepositoryPort')
    private readonly repository: LigneBordereauRepositoryPort,
  ) {}

  async execute(dto: CreateLigneBordereauDto): Promise<LigneBordereauEntity> {
    const entity = new LigneBordereauEntity({
      organisationId: dto.organisationId,
      bordereauId: dto.bordereauId,
      commissionId: dto.commissionId ?? null,
      repriseId: dto.repriseId ?? null,
      typeLigne: dto.typeLigne as any,
      contratId: dto.contratId,
      contratReference: dto.contratReference,
      clientNom: dto.clientNom ?? null,
      produitNom: dto.produitNom ?? null,
      montantBrut: dto.montantBrut,
      montantReprise: dto.montantReprise ?? 0,
      montantNet: dto.montantNet,
      baseCalcul: dto.baseCalcul ?? null,
      tauxApplique: dto.tauxApplique ?? null,
      baremeId: dto.baremeId ?? null,
      statutLigne: 'selectionnee',
      selectionne: true,
      motifDeselection: null,
      validateurId: null,
      dateValidation: null,
      ordre: dto.ordre ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(entity);
  }
}
