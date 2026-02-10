import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { SocieteEntity } from '../../../../../domain/organisations/entities';

@Injectable()
export class SocieteService {
  private readonly logger = new Logger(SocieteService.name);

  constructor(
    @InjectRepository(SocieteEntity)
    private readonly repository: Repository<SocieteEntity>,
  ) {}

  async create(input: {
    organisationId: string;
    raisonSociale: string;
    siren: string;
    numeroTva: string;
    logoUrl?: string;
    devise?: string;
    ics?: string;
    journalVente?: string;
    compteProduitDefaut?: string;
    planComptable?: Record<string, any> | null;
    adresseSiege?: string;
    telephone?: string;
    emailContact?: string;
    parametresFiscaux?: Record<string, any> | null;
  }): Promise<SocieteEntity> {
    const entity = this.repository.create({
      organisationId: input.organisationId,
      raisonSociale: input.raisonSociale,
      siren: input.siren,
      numeroTva: input.numeroTva,
      logoUrl: input.logoUrl ?? null,
      devise: input.devise ?? 'EUR',
      ics: input.ics ?? null,
      journalVente: input.journalVente ?? null,
      compteProduitDefaut: input.compteProduitDefaut ?? null,
      planComptable: input.planComptable ?? null,
      adresseSiege: input.adresseSiege ?? null,
      telephone: input.telephone ?? null,
      emailContact: input.emailContact ?? null,
      parametresFiscaux: input.parametresFiscaux ?? null,
    });
    return this.repository.save(entity);
  }

  async update(input: {
    id: string;
    raisonSociale?: string;
    siren?: string;
    numeroTva?: string;
    logoUrl?: string;
    devise?: string;
    ics?: string;
    journalVente?: string;
    compteProduitDefaut?: string;
    planComptable?: Record<string, any> | null;
    adresseSiege?: string;
    telephone?: string;
    emailContact?: string;
    parametresFiscaux?: Record<string, any> | null;
  }): Promise<SocieteEntity> {
    const entity = await this.findById(input.id);

    if (input.raisonSociale !== undefined) entity.raisonSociale = input.raisonSociale;
    if (input.siren !== undefined) entity.siren = input.siren;
    if (input.numeroTva !== undefined) entity.numeroTva = input.numeroTva;
    if (input.logoUrl !== undefined) entity.logoUrl = input.logoUrl ?? null;
    if (input.devise !== undefined) entity.devise = input.devise;
    if (input.ics !== undefined) entity.ics = input.ics ?? null;
    if (input.journalVente !== undefined) entity.journalVente = input.journalVente ?? null;
    if (input.compteProduitDefaut !== undefined) entity.compteProduitDefaut = input.compteProduitDefaut ?? null;
    if (input.planComptable !== undefined) entity.planComptable = input.planComptable ?? null;
    if (input.adresseSiege !== undefined) entity.adresseSiege = input.adresseSiege ?? null;
    if (input.telephone !== undefined) entity.telephone = input.telephone ?? null;
    if (input.emailContact !== undefined) entity.emailContact = input.emailContact ?? null;
    if (input.parametresFiscaux !== undefined) entity.parametresFiscaux = input.parametresFiscaux ?? null;

    return this.repository.save(entity);
  }

  async findById(id: string): Promise<SocieteEntity> {
    if (!id) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'Societe id is required' });
    }
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Societe ${id} not found` });
    }
    return entity;
  }

  async findByOrganisation(
    organisationId: string,
    pagination?: { page?: number; limit?: number },
  ): Promise<{
    societes: SocieteEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;

    if (!organisationId) {
      return { societes: [], pagination: { total: 0, page, limit, totalPages: 0 } };
    }

    const [societes, total] = await this.repository.findAndCount({
      where: { organisationId },
      order: { raisonSociale: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { societes, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findAll(
    filters?: { search?: string },
    pagination?: { page?: number; limit?: number },
  ): Promise<{
    societes: SocieteEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;

    const queryBuilder = this.repository.createQueryBuilder('s');

    if (filters?.search) {
      queryBuilder.where('(s.raison_sociale ILIKE :search OR s.siren ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    const [societes, total] = await queryBuilder
      .orderBy('s.raison_sociale', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { societes, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
