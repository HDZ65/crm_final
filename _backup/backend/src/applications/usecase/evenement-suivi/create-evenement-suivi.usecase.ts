import { Injectable, Inject } from '@nestjs/common';
import { EvenementSuiviEntity } from '../../../core/domain/evenement-suivi.entity';
import type { EvenementSuiviRepositoryPort } from '../../../core/port/evenement-suivi-repository.port';
import { CreateEvenementSuiviDto } from '../../dto/evenement-suivi/create-evenement-suivi.dto';

@Injectable()
export class CreateEvenementSuiviUseCase {
  constructor(
    @Inject('EvenementSuiviRepositoryPort')
    private readonly repository: EvenementSuiviRepositoryPort,
  ) {}

  async execute(dto: CreateEvenementSuiviDto): Promise<EvenementSuiviEntity> {
    const entity = new EvenementSuiviEntity({
      expeditionId: dto.expeditionId,
      code: dto.code,
      label: dto.label,
      dateEvenement: dto.dateEvenement,
      lieu: dto.lieu,
      raw: dto.raw,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}
