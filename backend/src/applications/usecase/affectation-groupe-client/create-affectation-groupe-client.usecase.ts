import { Injectable, Inject } from '@nestjs/common';
import { AffectationGroupeClientEntity } from '../../../core/domain/affectation-groupe-client.entity';
import type { AffectationGroupeClientRepositoryPort } from '../../../core/port/affectation-groupe-client-repository.port';
import { CreateAffectationGroupeClientDto } from '../../dto/affectation-groupe-client/create-affectation-groupe-client.dto';

@Injectable()
export class CreateAffectationGroupeClientUseCase {
  constructor(
    @Inject('AffectationGroupeClientRepositoryPort')
    private readonly repository: AffectationGroupeClientRepositoryPort,
  ) {}

  async execute(
    dto: CreateAffectationGroupeClientDto,
  ): Promise<AffectationGroupeClientEntity> {
    const entity = new AffectationGroupeClientEntity({
      groupeId: dto.groupeId,
      clientBaseId: dto.clientBaseId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}
