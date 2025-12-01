import { Injectable, Inject } from '@nestjs/common';
import { ClientPartenaireEntity } from '../../../core/domain/client-partenaire.entity';
import type { ClientPartenaireRepositoryPort } from '../../../core/port/client-partenaire-repository.port';
import { CreateClientPartenaireDto } from '../../dto/client-partenaire/create-client-partenaire.dto';

@Injectable()
export class CreateClientPartenaireUseCase {
  constructor(
    @Inject('ClientPartenaireRepositoryPort')
    private readonly repository: ClientPartenaireRepositoryPort,
  ) {}

  async execute(
    dto: CreateClientPartenaireDto,
  ): Promise<ClientPartenaireEntity> {
    const entity = new ClientPartenaireEntity({
      clientBaseId: dto.clientBaseId,
      partenaireId: dto.partenaireId,
      rolePartenaireId: dto.rolePartenaireId,
      validFrom: dto.validFrom,
      validTo: dto.validTo,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}
