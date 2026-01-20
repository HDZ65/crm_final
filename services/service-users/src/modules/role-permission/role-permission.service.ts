import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { RolePermissionEntity } from './entities/role-permission.entity';

@Injectable()
export class RolePermissionService {
  private readonly logger = new Logger(RolePermissionService.name);

  constructor(
    @InjectRepository(RolePermissionEntity)
    private readonly repository: Repository<RolePermissionEntity>,
  ) {}

  async create(input: { roleId: string; permissionId: string }): Promise<RolePermissionEntity> {
    const existing = await this.repository.findOne({
      where: { roleId: input.roleId, permissionId: input.permissionId },
    });
    if (existing) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: `Role-Permission association already exists`,
      });
    }

    const entity = this.repository.create({
      roleId: input.roleId,
      permissionId: input.permissionId,
    });
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<RolePermissionEntity> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `RolePermission ${id} not found` });
    }
    return entity;
  }

  async findByRole(roleId: string, pagination?: { page?: number; limit?: number }): Promise<{
    rolePermissions: RolePermissionEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;

    const [rolePermissions, total] = await this.repository.findAndCount({
      where: { roleId },
      relations: ['permission'],
      skip: (page - 1) * limit,
      take: limit,
    });

    return { rolePermissions, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
