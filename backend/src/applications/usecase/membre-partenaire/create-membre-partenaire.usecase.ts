import { Injectable, Inject } from '@nestjs/common';
import { MembrePartenaireEntity } from '../../../core/domain/membre-partenaire.entity';
import type { MembrePartenaireRepositoryPort } from '../../../core/port/membre-partenaire-repository.port';
import { CreateMembrePartenaireDto } from '../../dto/membre-partenaire/create-membre-partenaire.dto';

@Injectable()
export class CreateMembrePartenaireUseCase {
  constructor(
    @Inject('MembrePartenaireRepositoryPort')
    private readonly repository: MembrePartenaireRepositoryPort,
  ) {}

  async execute(
    dto: CreateMembrePartenaireDto,
  ): Promise<MembrePartenaireEntity> {
    const entity = new MembrePartenaireEntity({
      utilisateurId: dto.utilisateurId,
      partenaireMarqueBlancheId: dto.partenaireMarqueBlancheId,
      role: dto.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}
