import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContratEntity } from '../../../../../domain/contrats/entities/contrat.entity';

export interface CreateContratInput {
  keycloakGroupId: string;
  reference: string;
  titre?: string;
  statut?: string;
  dateDebut?: string | Date;
  dateSignature?: string | Date;
  montant?: number;
  devise?: string;
  frequenceFacturation?: string;
  fournisseur?: string;
  clientId: string;
  commercialId?: string;
  notes?: string;
}

export interface UpdateContratInput {
  id: string;
  reference?: string;
  titre?: string;
  statut?: string;
  dateDebut?: string | Date;
  dateSignature?: string | Date;
  montant?: number;
  devise?: string;
  frequenceFacturation?: string;
  fournisseur?: string;
  clientId?: string;
  commercialId?: string;
  notes?: string;
}

@Injectable()
export class ContratService {
  constructor(
    @InjectRepository(ContratEntity)
    private readonly repository: Repository<ContratEntity>,
  ) {}

  async findById(id: string): Promise<ContratEntity> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new Error(`Contrat not found: ${id}`);
    }
    return entity;
  }

  async findByReference(keycloakGroupId: string, reference: string): Promise<ContratEntity> {
    const entity = await this.repository.findOne({ where: { keycloakGroupId, reference } });
    if (!entity) {
      throw new Error(`Contrat not found: reference=${reference}`);
    }
    return entity;
  }

  async create(input: CreateContratInput): Promise<ContratEntity> {
    const entity = this.repository.create({
      keycloakGroupId: input.keycloakGroupId,
      reference: input.reference,
      titre: input.titre || null,
      statut: input.statut || 'ACTIF',
      dateDebut: input.dateDebut ? new Date(input.dateDebut) : null,
      dateSignature: input.dateSignature ? new Date(input.dateSignature) : null,
      montant: input.montant ?? null,
      devise: input.devise || 'EUR',
      frequenceFacturation: input.frequenceFacturation || null,
      fournisseur: input.fournisseur || null,
      clientId: input.clientId,
      commercialId: input.commercialId || null,
      notes: input.notes || null,
      deletedAt: null,
    });
    return this.repository.save(entity);
  }

  async update(input: UpdateContratInput): Promise<ContratEntity> {
    const entity = await this.findById(input.id);

    if (input.reference !== undefined) entity.reference = input.reference;
    if (input.titre !== undefined) entity.titre = input.titre || null;
    if (input.statut !== undefined) entity.statut = input.statut;
    if (input.dateDebut !== undefined) entity.dateDebut = input.dateDebut ? new Date(input.dateDebut) : null;
    if (input.dateSignature !== undefined) entity.dateSignature = input.dateSignature ? new Date(input.dateSignature) : null;
    if (input.montant !== undefined) entity.montant = input.montant ?? null;
    if (input.devise !== undefined) entity.devise = input.devise;
    if (input.frequenceFacturation !== undefined) entity.frequenceFacturation = input.frequenceFacturation || null;
    if (input.fournisseur !== undefined) entity.fournisseur = input.fournisseur || null;
    if (input.clientId !== undefined) entity.clientId = input.clientId;
    if (input.commercialId !== undefined) entity.commercialId = input.commercialId || null;
    if (input.notes !== undefined) entity.notes = input.notes || null;

    return this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
