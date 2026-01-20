import { Injectable, Inject } from '@nestjs/common';
import { ClientEntrepriseEntity } from '../../../core/domain/client-entreprise.entity';
import type { ClientEntrepriseRepositoryPort } from '../../../core/port/client-entreprise-repository.port';
import { CreateClientEntrepriseDto } from '../../dto/client-entreprise/create-client-entreprise.dto';

@Injectable()
export class CreateClientEntrepriseUseCase {
  constructor(
    @Inject('ClientEntrepriseRepositoryPort')
    private readonly repository: ClientEntrepriseRepositoryPort,
  ) {}

  async execute(
    dto: CreateClientEntrepriseDto,
  ): Promise<ClientEntrepriseEntity> {
    const entity = new ClientEntrepriseEntity({
      raisonSociale: dto.raisonSociale,
      numeroTVA: dto.numeroTVA,
      siren: dto.siren,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}
