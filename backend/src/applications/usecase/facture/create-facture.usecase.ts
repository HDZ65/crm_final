import { Injectable, Inject } from '@nestjs/common';
import { FactureEntity } from '../../../core/domain/facture.entity';
import type { FactureRepositoryPort } from '../../../core/port/facture-repository.port';
import { CreateFactureDto } from '../../dto/facture/create-facture.dto';

@Injectable()
export class CreateFactureUseCase {
  constructor(
    @Inject('FactureRepositoryPort')
    private readonly repository: FactureRepositoryPort,
  ) {}

  async execute(dto: CreateFactureDto): Promise<FactureEntity> {
    const entity = new FactureEntity({
      organisationId: dto.organisationId,
      numero: dto.numero,
      dateEmission: dto.dateEmission,
      montantHT: dto.montantHT,
      montantTTC: dto.montantTTC,
      statutId: dto.statutId,
      emissionFactureId: dto.emissionFactureId,
      clientBaseId: dto.clientBaseId,
      contratId: dto.contratId,
      clientPartenaireId: dto.clientPartenaireId,
      adresseFacturationId: dto.adresseFacturationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(entity);
  }
}
