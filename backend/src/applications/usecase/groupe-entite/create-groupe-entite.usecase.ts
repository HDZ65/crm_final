import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { GroupeEntiteEntity } from '../../../core/domain/groupe-entite.entity';
import type { GroupeEntiteRepositoryPort } from '../../../core/port/groupe-entite-repository.port';
import { CreateGroupeEntiteDto } from '../../dto/groupe-entite/create-groupe-entite.dto';

@Injectable()
export class CreateGroupeEntiteUseCase {
  constructor(
    @Inject('GroupeEntiteRepositoryPort')
    private readonly repository: GroupeEntiteRepositoryPort,
  ) {}

  async execute(dto: CreateGroupeEntiteDto): Promise<GroupeEntiteEntity> {
    // Vérifier si la liaison existe déjà
    const existing = await this.repository.findByGroupeAndEntite(dto.groupeId, dto.entiteId);
    if (existing) {
      throw new BadRequestException('Cette entité est déjà associée à ce groupe');
    }

    const entity = new GroupeEntiteEntity({
      groupeId: dto.groupeId,
      entiteId: dto.entiteId,
      type: dto.type,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(entity);
  }
}
