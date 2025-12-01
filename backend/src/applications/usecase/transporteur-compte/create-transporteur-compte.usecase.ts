import { Injectable, Inject } from '@nestjs/common';
import { TransporteurCompteEntity } from '../../../core/domain/transporteur-compte.entity';
import type { TransporteurCompteRepositoryPort } from '../../../core/port/transporteur-compte-repository.port';
import { CreateTransporteurCompteDto } from '../../dto/transporteur-compte/create-transporteur-compte.dto';

@Injectable()
export class CreateTransporteurCompteUseCase {
  constructor(
    @Inject('TransporteurCompteRepositoryPort')
    private readonly repository: TransporteurCompteRepositoryPort,
  ) {}

  async execute(
    dto: CreateTransporteurCompteDto,
  ): Promise<TransporteurCompteEntity> {
    const entity = new TransporteurCompteEntity({
      type: dto.type,
      organisationId: dto.organisationId,
      contractNumber: dto.contractNumber,
      password: dto.password,
      labelFormat: dto.labelFormat,
      actif: dto.actif,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}
