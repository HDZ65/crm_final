import { Injectable, Inject } from '@nestjs/common';
import { RolePartenaireEntity } from '../../../core/domain/role-partenaire.entity';
import type { RolePartenaireRepositoryPort } from '../../../core/port/role-partenaire-repository.port';
import { CreateRolePartenaireDto } from '../../dto/role-partenaire/create-role-partenaire.dto';

@Injectable()
export class CreateRolePartenaireUseCase {
  constructor(
    @Inject('RolePartenaireRepositoryPort')
    private readonly repository: RolePartenaireRepositoryPort,
  ) {}

  async execute(dto: CreateRolePartenaireDto): Promise<RolePartenaireEntity> {
    const entity = new RolePartenaireEntity({
      code: dto.code,
      nom: dto.nom,
      description: dto.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}
