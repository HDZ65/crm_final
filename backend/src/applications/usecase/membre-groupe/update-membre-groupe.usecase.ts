import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { MembreGroupeEntity } from '../../../core/domain/membre-groupe.entity';
import type { MembreGroupeRepositoryPort } from '../../../core/port/membre-groupe-repository.port';
import { UpdateMembreGroupeDto } from '../../dto/membre-groupe/update-membre-groupe.dto';

@Injectable()
export class UpdateMembreGroupeUseCase {
  constructor(
    @Inject('MembreGroupeRepositoryPort')
    private readonly repository: MembreGroupeRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateMembreGroupeDto,
  ): Promise<MembreGroupeEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('MembreGroupe with id ' + id + ' not found');
    }

    if (dto.membreCompteId !== undefined) {
      existing.membreCompteId = dto.membreCompteId;
    }
    if (dto.groupeId !== undefined) {
      existing.groupeId = dto.groupeId;
    }
    if (dto.roleLocal !== undefined) {
      existing.roleLocal = dto.roleLocal;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}
