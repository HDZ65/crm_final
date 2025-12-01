import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { MembrePartenaireEntity } from '../../../core/domain/membre-partenaire.entity';
import type { MembrePartenaireRepositoryPort } from '../../../core/port/membre-partenaire-repository.port';
import { UpdateMembrePartenaireDto } from '../../dto/membre-partenaire/update-membre-partenaire.dto';

@Injectable()
export class UpdateMembrePartenaireUseCase {
  constructor(
    @Inject('MembrePartenaireRepositoryPort')
    private readonly repository: MembrePartenaireRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateMembrePartenaireDto,
  ): Promise<MembrePartenaireEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(
        'MembrePartenaire with id ' + id + ' not found',
      );
    }

    if (dto.role !== undefined) {
      existing.role = dto.role;
    }
    existing.updatedAt = new Date();

    // Add business logic here (if needed)

    return await this.repository.update(id, existing);
  }
}
