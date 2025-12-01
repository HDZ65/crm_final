import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ClientPartenaireEntity } from '../../../core/domain/client-partenaire.entity';
import type { ClientPartenaireRepositoryPort } from '../../../core/port/client-partenaire-repository.port';
import { UpdateClientPartenaireDto } from '../../dto/client-partenaire/update-client-partenaire.dto';

@Injectable()
export class UpdateClientPartenaireUseCase {
  constructor(
    @Inject('ClientPartenaireRepositoryPort')
    private readonly repository: ClientPartenaireRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateClientPartenaireDto,
  ): Promise<ClientPartenaireEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'ClientPartenaire with id ' + id + ' not found',
      );
    }

    if (dto.clientBaseId !== undefined) {
      existing.clientBaseId = dto.clientBaseId;
    }
    if (dto.partenaireId !== undefined) {
      existing.partenaireId = dto.partenaireId;
    }
    if (dto.rolePartenaireId !== undefined) {
      existing.rolePartenaireId = dto.rolePartenaireId;
    }
    if (dto.validFrom !== undefined) {
      existing.validFrom = dto.validFrom;
    }
    if (dto.validTo !== undefined) {
      existing.validTo = dto.validTo;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}
