import { Injectable, Inject } from '@nestjs/common';
import { ContratEntity } from '../../../core/domain/contrat.entity';
import type { ContratRepositoryPort } from '../../../core/port/contrat-repository.port';
import { CreateContratDto } from '../../dto/contrat/create-contrat.dto';

@Injectable()
export class CreateContratUseCase {
  constructor(
    @Inject('ContratRepositoryPort')
    private readonly repository: ContratRepositoryPort,
  ) {}

  async execute(dto: CreateContratDto): Promise<ContratEntity> {
    const entity = new ContratEntity({
      organisationId: dto.organisationId,
      referenceExterne: dto.referenceExterne,
      dateSignature: dto.dateSignature,
      dateDebut: dto.dateDebut,
      dateFin: dto.dateFin,
      statutId: dto.statutId,
      autoRenouvellement: dto.autoRenouvellement,
      joursPreavis: dto.joursPreavis,
      conditionPaiementId: dto.conditionPaiementId,
      modeleDistributionId: dto.modeleDistributionId,
      facturationParId: dto.facturationParId,
      clientBaseId: dto.clientBaseId,
      societeId: dto.societeId,
      commercialId: dto.commercialId,
      clientPartenaireId: dto.clientPartenaireId,
      adresseFacturationId: dto.adresseFacturationId,
      dateFinRetractation: dto.dateFinRetractation,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(entity);
  }
}
