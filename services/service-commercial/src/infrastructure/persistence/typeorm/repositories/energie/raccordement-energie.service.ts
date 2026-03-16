import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import {
  RaccordementEnergieEntity,
  PartenaireEnergie,
  StatutRaccordement,
} from '../../../../../domain/energie/entities/raccordement-energie.entity';
import { EnergieStatusHistoryEntity } from '../../../../../domain/energie/entities/energie-status-history.entity';

@Injectable()
export class RaccordementEnergieRepositoryService {
  private readonly logger = new Logger(RaccordementEnergieRepositoryService.name);

  constructor(
    @InjectRepository(RaccordementEnergieEntity)
    private readonly repository: Repository<RaccordementEnergieEntity>,
    @InjectRepository(EnergieStatusHistoryEntity)
    private readonly historyRepository: Repository<EnergieStatusHistoryEntity>,
  ) {}

  async findById(id: string): Promise<RaccordementEnergieEntity> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['statusHistory'],
    });
    if (!entity) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Raccordement énergie ${id} not found`,
      });
    }
    return entity;
  }

  async findByClientId(clientId: string): Promise<RaccordementEnergieEntity[]> {
    return this.repository.find({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByContratId(contratId: string): Promise<RaccordementEnergieEntity | null> {
    return this.repository.findOne({
      where: { contratId },
      relations: ['statusHistory'],
    });
  }

  async findByPartenaire(partenaire: PartenaireEnergie): Promise<RaccordementEnergieEntity[]> {
    return this.repository.find({
      where: { partenaire },
      order: { createdAt: 'DESC' },
    });
  }

  async create(input: {
    clientId: string;
    contratId: string;
    partenaire: PartenaireEnergie;
    statutRaccordement?: StatutRaccordement;
    statutActivation?: string | null;
    adresse?: string | null;
    pdlPce?: string | null;
    dateDemande: Date;
    dateActivation?: Date | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<RaccordementEnergieEntity> {
    const entity = this.repository.create({
      clientId: input.clientId,
      contratId: input.contratId,
      partenaire: input.partenaire,
      statutRaccordement: input.statutRaccordement ?? StatutRaccordement.DEMANDE_ENVOYEE,
      statutActivation: input.statutActivation ?? null,
      adresse: input.adresse ?? null,
      pdlPce: input.pdlPce ?? null,
      dateDemande: input.dateDemande,
      dateActivation: input.dateActivation ?? null,
      metadata: input.metadata ?? null,
    });
    const saved = await this.repository.save(entity);
    this.logger.log(`Created raccordement énergie ${saved.id} for contrat ${input.contratId}`);
    return saved;
  }

  async update(
    id: string,
    input: Partial<
      Pick<
        RaccordementEnergieEntity,
        | 'statutRaccordement'
        | 'statutActivation'
        | 'adresse'
        | 'pdlPce'
        | 'dateActivation'
        | 'metadata'
      >
    >,
  ): Promise<RaccordementEnergieEntity> {
    const entity = await this.findById(id);

    if (input.statutRaccordement !== undefined) entity.statutRaccordement = input.statutRaccordement;
    if (input.statutActivation !== undefined) entity.statutActivation = input.statutActivation;
    if (input.adresse !== undefined) entity.adresse = input.adresse;
    if (input.pdlPce !== undefined) entity.pdlPce = input.pdlPce;
    if (input.dateActivation !== undefined) entity.dateActivation = input.dateActivation;
    if (input.metadata !== undefined) entity.metadata = input.metadata;

    const saved = await this.repository.save(entity);
    this.logger.log(`Updated raccordement énergie ${id}`);
    return saved;
  }

  async addHistory(input: {
    raccordementId: string;
    previousStatus: string;
    newStatus: string;
    source?: string | null;
    changedAt?: Date;
  }): Promise<EnergieStatusHistoryEntity> {
    const history = this.historyRepository.create({
      raccordementId: input.raccordementId,
      previousStatus: input.previousStatus,
      newStatus: input.newStatus,
      source: input.source ?? null,
      changedAt: input.changedAt ?? new Date(),
    });
    return this.historyRepository.save(history);
  }
}
