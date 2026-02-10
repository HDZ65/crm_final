import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { RoleEntity } from '../../../../../domain/users/entities';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(
    @InjectRepository(RoleEntity)
    private readonly repository: Repository<RoleEntity>,
  ) {}

  async create(input: { code: string; nom: string; description?: string }): Promise<RoleEntity> {
    const existing = await this.repository.findOne({ where: { code: input.code } });
    if (existing) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: `Role with code ${input.code} already exists`,
      });
    }

    const entity = this.repository.create({
      code: input.code,
      nom: input.nom,
      description: input.description || null,
    });
    return this.repository.save(entity);
  }

  async update(input: { id: string; code?: string; nom?: string; description?: string }): Promise<RoleEntity> {
    const entity = await this.findById(input.id);

    if (input.code !== undefined) entity.code = input.code;
    if (input.nom !== undefined) entity.nom = input.nom;
    if (input.description !== undefined) entity.description = input.description || null;

    return this.repository.save(entity);
  }

  async findById(id: string): Promise<RoleEntity> {
    if (!id) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'Role id is required' });
    }
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Role ${id} not found` });
    }
    return entity;
  }

  async findByCode(code: string): Promise<RoleEntity> {
    const entity = await this.repository.findOne({ where: { code } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Role with code ${code} not found` });
    }
    return entity;
  }

  async findAll(pagination?: { page?: number; limit?: number }): Promise<{
    roles: RoleEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;

    const [roles, total] = await this.repository.findAndCount({
      order: { nom: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { roles, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
