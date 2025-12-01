import { Injectable, Inject } from '@nestjs/common';
import { ConditionPaiementEntity } from '../../../core/domain/condition-paiement.entity';
import type { ConditionPaiementRepositoryPort } from '../../../core/port/condition-paiement-repository.port';
import { CreateConditionPaiementDto } from '../../dto/condition-paiement/create-condition-paiement.dto';

@Injectable()
export class CreateConditionPaiementUseCase {
  constructor(
    @Inject('ConditionPaiementRepositoryPort')
    private readonly repository: ConditionPaiementRepositoryPort,
  ) {}

  async execute(
    dto: CreateConditionPaiementDto,
  ): Promise<ConditionPaiementEntity> {
    const entity = new ConditionPaiementEntity({
      code: dto.code,
      nom: dto.nom,
      description: dto.description,
      delaiJours: dto.delaiJours,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}
