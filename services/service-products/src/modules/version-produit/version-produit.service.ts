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
} from '@proto/products/products';
import { VersionProduitEntity } from './entities/version-produit.entity';

@Injectable()
export class VersionProduitService {
  constructor(
    @InjectRepository(VersionProduitEntity)
    private readonly repository: Repository<VersionProduitEntity>,
  ) {}

  async create(input: CreateProduitVersionRequest): Promise<VersionProduitEntity> {
    const existing = await this.repository.findOne({
      where: { produitId: input.produitId, version: input.version },
    });
    if (existing) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: `Version ${input.version} already exists for product ${input.produitId}`,
      });
    }

    const entity = this.repository.create({
      produitId: input.produitId,
      version: input.version,
      effectiveFrom: new Date(input.effectiveFrom),
      effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null,
      notes: input.notes || null,
      breakingChanges: input.breakingChanges ?? false,
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

    if (input.effectiveFrom !== undefined) {
      entity.effectiveFrom = input.effectiveFrom ? new Date(input.effectiveFrom) : entity.effectiveFrom;
    }
    if (input.effectiveTo !== undefined) {
      entity.effectiveTo = input.effectiveTo ? new Date(input.effectiveTo) : null;
    }
    if (input.notes !== undefined) entity.notes = input.notes || null;
    if (input.breakingChanges !== undefined) entity.breakingChanges = input.breakingChanges;

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
      where: { produitId: input.produitId },
      order: { version: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { versions, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
