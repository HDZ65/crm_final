import { Injectable, Inject } from '@nestjs/common';
import { MembreGroupeEntity } from '../../../core/domain/membre-groupe.entity';
import type { MembreGroupeRepositoryPort } from '../../../core/port/membre-groupe-repository.port';
import { CreateMembreGroupeDto } from '../../dto/membre-groupe/create-membre-groupe.dto';

@Injectable()
export class CreateMembreGroupeUseCase {
  constructor(
    @Inject('MembreGroupeRepositoryPort')
    private readonly repository: MembreGroupeRepositoryPort,
  ) {}

  async execute(dto: CreateMembreGroupeDto): Promise<MembreGroupeEntity> {
    const entity = new MembreGroupeEntity({
      membreCompteId: dto.membreCompteId,
      groupeId: dto.groupeId,
      roleLocal: dto.roleLocal,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add business logic here (if needed)

    return await this.repository.create(entity);
  }
}
