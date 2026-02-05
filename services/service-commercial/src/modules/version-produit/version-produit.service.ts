import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import type {
  CreateProduitVersionRequest,
  UpdateProduitVersionRequest,
  ListProduitVersionsRequest,
  GetProduitVersionRequest,
} from '@crm/proto/products';
import { VersionProduitEntity } from './entities/version-produit.entity';

@Injectable()
export class VersionProduitService {
  constructor(
    @InjectRepository(VersionProduitEntity)
    private readonly repository: Repository<VersionProduitEntity>,
  ) {}

  async create(input: CreateProduitVersionRequest): Promise<VersionProduitEntity> {
    const existing = await this.repository.findOne({
      where: { produitId: input.produit_id, version: input.version },
    });
    if (existing) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: `Version ${input.version} already exists for product ${input.produit_id}`,
      });
    }

    const entity = this.repository.create({
      produitId: input.produit_id,
      version: input.version,
      effectiveFrom: new Date(input.effective_from),
      effectiveTo: input.effective_to ? new Date(input.effective_to) : null,
      notes: input.notes || null,
      breakingChanges: input.breaking_changes ?? false,
    });
    return this.repository.save(entity);
  }

  async update(input: UpdateProduitVersionRequest): Promise<VersionProduitEntity> {
    const entity = await this.repository.findOne({ where: { id: input.id } });
    if (!entity) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Version ${input.id} not found`,
      });
    }

    if (input.effective_from !== undefined) {
      entity.effectiveFrom = input.effective_from ? new Date(input.effective_from) : entity.effectiveFrom;
    }
    if (input.effective_to !== undefined) {
      entity.effectiveTo = input.effective_to ? new Date(input.effective_to) : null;
    }
    if (input.notes !== undefined) entity.notes = input.notes || null;
    if (input.breaking_changes !== undefined) entity.breakingChanges = input.breaking_changes;

    return this.repository.save(entity);
  }

  async findById(input: GetProduitVersionRequest): Promise<VersionProduitEntity> {
    const entity = await this.repository.findOne({ where: { id: input.id }, relations: ['produit'] });
    if (!entity) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Version ${input.id} not found`,
      });
    }
    return entity;
  }

  async findByProduit(
    input: ListProduitVersionsRequest,
  ): Promise<{ versions: VersionProduitEntity[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const page = input.pagination?.page ?? 1;
    const limit = input.pagination?.limit ?? 20;

    const [versions, total] = await this.repository.findAndCount({
      where: { produitId: input.produit_id },
      order: { version: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { versions, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
