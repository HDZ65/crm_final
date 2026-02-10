import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InformationPaiementBancaireEntity } from '../../../../../domain/payments/entities/information-paiement-bancaire.entity';

export interface CreateInformationPaiementBancaireInput {
  organisationId: string;
  clientId: string;
  iban: string;
  bic: string;
  titulaireCompte?: string | null;
  mandatSepaReference?: string | null;
  dateMandat?: Date | null;
  statut?: string;
  commentaire?: string | null;
  externalId?: string | null;
}

export interface UpdateInformationPaiementBancaireInput {
  iban?: string;
  bic?: string;
  titulaireCompte?: string | null;
  mandatSepaReference?: string | null;
  dateMandat?: Date | null;
  statut?: string;
  commentaire?: string | null;
}

@Injectable()
export class InformationPaiementBancaireService {
  private readonly logger = new Logger(InformationPaiementBancaireService.name);

  constructor(
    @InjectRepository(InformationPaiementBancaireEntity)
    private readonly repository: Repository<InformationPaiementBancaireEntity>,
  ) {}

  /**
   * Create a new payment information record
   */
  async create(input: CreateInformationPaiementBancaireInput): Promise<InformationPaiementBancaireEntity> {
    // Check for duplicate external_id within the same organisation
    if (input.externalId) {
      const existing = await this.repository.findOne({
        where: {
          organisationId: input.organisationId,
          externalId: input.externalId,
        },
      });

      if (existing) {
        throw new ConflictException(
          `Payment information with external_id=${input.externalId} already exists for organisation=${input.organisationId}`,
        );
      }
    }

    const entity = this.repository.create({
      organisationId: input.organisationId,
      clientId: input.clientId,
      iban: input.iban,
      bic: input.bic,
      titulaireCompte: input.titulaireCompte ?? null,
      mandatSepaReference: input.mandatSepaReference ?? null,
      dateMandat: input.dateMandat ?? null,
      statut: input.statut ?? 'ACTIF',
      commentaire: input.commentaire ?? null,
      externalId: input.externalId ?? null,
    });

    const saved = await this.repository.save(entity);

    this.logger.log(
      `Created payment information id=${saved.id} for client=${input.clientId} external_id=${input.externalId ?? 'N/A'}`,
    );

    return saved;
  }

  /**
   * Find payment information by ID
   */
  async findById(id: string): Promise<InformationPaiementBancaireEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  /**
   * Find all payment information records for a client
   */
  async findByClientId(clientId: string): Promise<InformationPaiementBancaireEntity[]> {
    return this.repository.find({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find payment information by external ID (scoped to organisation)
   */
  async findByExternalId(
    organisationId: string,
    externalId: string,
  ): Promise<InformationPaiementBancaireEntity | null> {
    return this.repository.findOne({
      where: {
        organisationId,
        externalId,
      },
    });
  }

  /**
   * Update existing payment information
   */
  async update(
    id: string,
    input: UpdateInformationPaiementBancaireInput,
  ): Promise<InformationPaiementBancaireEntity> {
    const entity = await this.repository.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException(`Payment information with id=${id} not found`);
    }

    // Apply updates
    if (input.iban !== undefined) entity.iban = input.iban;
    if (input.bic !== undefined) entity.bic = input.bic;
    if (input.titulaireCompte !== undefined) entity.titulaireCompte = input.titulaireCompte;
    if (input.mandatSepaReference !== undefined) entity.mandatSepaReference = input.mandatSepaReference;
    if (input.dateMandat !== undefined) entity.dateMandat = input.dateMandat;
    if (input.statut !== undefined) entity.statut = input.statut;
    if (input.commentaire !== undefined) entity.commentaire = input.commentaire;

    const updated = await this.repository.save(entity);

    this.logger.log(`Updated payment information id=${id}`);

    return updated;
  }

  /**
   * Upsert payment information by external ID
   * Conflict resolution: most recent wins based on updated_at timestamp
   */
  async upsertByExternalId(
    input: CreateInformationPaiementBancaireInput & { updatedAt?: Date },
  ): Promise<{ entity: InformationPaiementBancaireEntity; created: boolean }> {
    if (!input.externalId) {
      throw new Error('externalId is required for upsert operation');
    }

    const existing = await this.findByExternalId(input.organisationId, input.externalId);

    if (!existing) {
      // Create new record
      const entity = await this.create(input);
      this.logger.log(
        `Upserted (created) payment information id=${entity.id} external_id=${input.externalId}`,
      );
      return { entity, created: true };
    }

    // Check if incoming data is more recent
    const incomingUpdatedAt = input.updatedAt ?? new Date();
    const existingUpdatedAt = existing.updatedAt;

    if (incomingUpdatedAt < existingUpdatedAt) {
      this.logger.warn(
        `Skipping upsert for external_id=${input.externalId}: incoming data is older (incoming=${incomingUpdatedAt.toISOString()}, existing=${existingUpdatedAt.toISOString()})`,
      );
      return { entity: existing, created: false };
    }

    // Update existing record
    const updated = await this.update(existing.id, {
      iban: input.iban,
      bic: input.bic,
      titulaireCompte: input.titulaireCompte,
      mandatSepaReference: input.mandatSepaReference,
      dateMandat: input.dateMandat,
      statut: input.statut,
      commentaire: input.commentaire,
    });

    this.logger.log(
      `Upserted (updated) payment information id=${updated.id} external_id=${input.externalId}`,
    );

    return { entity: updated, created: false };
  }

  /**
   * Delete payment information by ID
   */
  async delete(id: string): Promise<void> {
    const entity = await this.repository.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException(`Payment information with id=${id} not found`);
    }

    await this.repository.remove(entity);

    this.logger.log(`Deleted payment information id=${id}`);
  }

  /**
   * Find all active payment information for a client
   */
  async findActiveByClientId(clientId: string): Promise<InformationPaiementBancaireEntity[]> {
    return this.repository.find({
      where: {
        clientId,
        statut: 'ACTIF',
      },
      order: { createdAt: 'DESC' },
    });
  }
}
