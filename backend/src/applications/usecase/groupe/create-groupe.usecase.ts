import { Injectable, Inject } from '@nestjs/common';
import { GroupeEntity } from '../../../core/domain/groupe.entity';
import type { GroupeRepositoryPort } from '../../../core/port/groupe-repository.port';
import { CreateGroupeDto } from '../../dto/groupe/create-groupe.dto';

@Injectable()
export class CreateGroupeUseCase {
  constructor(
    @Inject('GroupeRepositoryPort')
    private readonly repository: GroupeRepositoryPort,
  ) {}

  async execute(dto: CreateGroupeDto): Promise<GroupeEntity> {
    const entity = new GroupeEntity({
      organisationId: dto.organisationId,
      nom: dto.nom,
      description: dto.description ?? null,
      type: dto.type,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}
