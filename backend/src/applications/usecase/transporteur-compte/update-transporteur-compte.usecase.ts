import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { TransporteurCompteEntity } from '../../../core/domain/transporteur-compte.entity';
import type { TransporteurCompteRepositoryPort } from '../../../core/port/transporteur-compte-repository.port';
import { UpdateTransporteurCompteDto } from '../../dto/transporteur-compte/update-transporteur-compte.dto';

@Injectable()
export class UpdateTransporteurCompteUseCase {
  constructor(
    @Inject('TransporteurCompteRepositoryPort')
    private readonly repository: TransporteurCompteRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateTransporteurCompteDto,
  ): Promise<TransporteurCompteEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'TransporteurCompte with id ' + id + ' not found',
      );
    }

    if (dto.type !== undefined) {
      existing.type = dto.type;
    }
    if (dto.organisationId !== undefined) {
      existing.organisationId = dto.organisationId;
    }
    if (dto.contractNumber !== undefined) {
      existing.contractNumber = dto.contractNumber;
    }
    if (dto.password !== undefined) {
      existing.password = dto.password;
    }
    if (dto.labelFormat !== undefined) {
      existing.labelFormat = dto.labelFormat;
    }
    if (dto.actif !== undefined) {
      existing.actif = dto.actif;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}
