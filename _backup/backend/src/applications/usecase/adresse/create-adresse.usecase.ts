import { Injectable, Inject } from '@nestjs/common';
import { AdresseEntity } from '../../../core/domain/adresse.entity';
import type { AdresseRepositoryPort } from '../../../core/port/adresse-repository.port';
import { CreateAdresseDto } from '../../dto/adresse/create-adresse.dto';

@Injectable()
export class CreateAdresseUseCase {
  constructor(
    @Inject('AdresseRepositoryPort')
    private readonly repository: AdresseRepositoryPort,
  ) {}

  async execute(dto: CreateAdresseDto): Promise<AdresseEntity> {
    const entity = new AdresseEntity({
      clientBaseId: dto.clientBaseId,
      ligne1: dto.ligne1,
      ligne2: dto.ligne2 ?? null,
      codePostal: dto.codePostal,
      ville: dto.ville,
      pays: dto.pays,
      type: dto.type,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(entity);
  }
}
