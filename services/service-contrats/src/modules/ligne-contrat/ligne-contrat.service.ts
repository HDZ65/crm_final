import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { LigneContratEntity } from './entities/ligne-contrat.entity';

@Injectable()
export class LigneContratService {
  private readonly logger = new Logger(LigneContratService.name);

  constructor(
    @InjectRepository(LigneContratEntity)
    private readonly repository: Repository<LigneContratEntity>,
  ) {}

  async create(input: {
    contratId: string;
    produitId: string;
    periodeFacturationId: string;
    quantite: number;
    prixUnitaire: number;
  }): Promise<LigneContratEntity> {
    const entity = this.repository.create({
      contratId: input.contratId,
      produitId: input.produitId,
      periodeFacturationId: input.periodeFacturationId,
      quantite: input.quantite,
      prixUnitaire: input.prixUnitaire,
    });
    return this.repository.save(entity);
  }

  async update(input: {
    id: string;
    produitId?: string;
    periodeFacturationId?: string;
    quantite?: number;
    prixUnitaire?: number;
  }): Promise<LigneContratEntity> {
    const entity = await this.findById(input.id);

    if (input.produitId !== undefined) entity.produitId = input.produitId;
    if (input.periodeFacturationId !== undefined) entity.periodeFacturationId = input.periodeFacturationId;
    if (input.quantite !== undefined) entity.quantite = input.quantite;
    if (input.prixUnitaire !== undefined) entity.prixUnitaire = input.prixUnitaire;

    return this.repository.save(entity);
  }

  async findById(id: string): Promise<LigneContratEntity> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Ligne contrat ${id} not found` });
    }
    return entity;
  }

  async findByContrat(
    contratId: string,
    pagination?: { page?: number; limit?: number },
  ): Promise<{
    lignes: LigneContratEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;

    const [lignes, total] = await this.repository.findAndCount({
      where: { contratId },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { lignes, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
