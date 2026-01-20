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
      reference: dto.reference,
      titre: dto.titre ?? null,
      description: dto.description ?? null,
      type: dto.type ?? null,
      statut: dto.statut,
      dateDebut: dto.dateDebut,
      dateFin: dto.dateFin ?? null,
      dateSignature: dto.dateSignature ?? null,
      montant: dto.montant ?? null,
      devise: dto.devise ?? 'EUR',
      frequenceFacturation: dto.frequenceFacturation ?? null,
      documentUrl: dto.documentUrl ?? null,
      fournisseur: dto.fournisseur ?? null,
      clientId: dto.clientId,
      commercialId: dto.commercialId,
      notes: dto.notes ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(entity);
  }
}
