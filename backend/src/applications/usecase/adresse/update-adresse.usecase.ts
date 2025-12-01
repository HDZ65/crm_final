import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { AdresseEntity } from '../../../core/domain/adresse.entity';
import type { AdresseRepositoryPort } from '../../../core/port/adresse-repository.port';
import { UpdateAdresseDto } from '../../dto/adresse/update-adresse.dto';

@Injectable()
export class UpdateAdresseUseCase {
  constructor(
    @Inject('AdresseRepositoryPort')
    private readonly repository: AdresseRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateAdresseDto): Promise<AdresseEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Adresse with id ' + id + ' not found');
    }

    if (dto.clientBaseId !== undefined) {
      existing.clientBaseId = dto.clientBaseId;
    }
    if (dto.ligne1 !== undefined) {
      existing.ligne1 = dto.ligne1;
    }
    if (dto.ligne2 !== undefined) {
      existing.ligne2 = dto.ligne2;
    }
    if (dto.codePostal !== undefined) {
      existing.codePostal = dto.codePostal;
    }
    if (dto.ville !== undefined) {
      existing.ville = dto.ville;
    }
    if (dto.pays !== undefined) {
      existing.pays = dto.pays;
    }
    if (dto.type !== undefined) {
      existing.type = dto.type;
    }
    existing.updatedAt = new Date();

    return await this.repository.update(id, existing);
  }
}
