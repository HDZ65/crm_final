import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ClientEntrepriseEntity } from '../../../core/domain/client-entreprise.entity';
import type { ClientEntrepriseRepositoryPort } from '../../../core/port/client-entreprise-repository.port';
import { UpdateClientEntrepriseDto } from '../../dto/client-entreprise/update-client-entreprise.dto';

@Injectable()
export class UpdateClientEntrepriseUseCase {
  constructor(
    @Inject('ClientEntrepriseRepositoryPort')
    private readonly repository: ClientEntrepriseRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateClientEntrepriseDto,
  ): Promise<ClientEntrepriseEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'ClientEntreprise with id ' + id + ' not found',
      );
    }

    if (dto.raisonSociale !== undefined) {
      existing.raisonSociale = dto.raisonSociale;
    }
    if (dto.numeroTVA !== undefined) {
      existing.numeroTVA = dto.numeroTVA;
    }
    if (dto.siren !== undefined) {
      existing.siren = dto.siren;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}
