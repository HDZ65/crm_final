import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { PermissionEntity } from '../../../../../domain/users/entities';

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  constructor(
    @InjectRepository(PermissionEntity)
    private readonly repository: Repository<PermissionEntity>,
  ) {}

  async create(input: { code: string; description?: string }): Promise<PermissionEntity> {
    const existing = await this.repository.findOne({ where: { code: input.code } });
    if (existing) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: `Permission with code ${input.code} already exists`,
      });
    }

    const entity = this.repository.create({
      code: input.code,
      description: input.description || null,
    });
    return this.repository.save(entity);
  }

  async update(input: { id: string; code?: string; description?: string }): Promise<PermissionEntity> {
    const entity = await this.findById(input.id);

    if (input.code !== undefined) entity.code = input.code;
    if (input.description !== undefined) entity.description = input.description || null;

    return this.repository.save(entity);
  }

  async findById(id: string): Promise<PermissionEntity> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Permission ${id} not found` });
    }
    return entity;
  }

  async findByCode(code: string): Promise<PermissionEntity> {
    const entity = await this.repository.findOne({ where: { code } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Permission with code ${code} not found` });
    }
    return entity;
  }

  async findAll(pagination?: { page?: number; limit?: number }): Promise<{
    permissions: PermissionEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;

    const [permissions, total] = await this.repository.findAndCount({
      order: { code: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { permissions, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
