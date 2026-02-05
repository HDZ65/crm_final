import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { MembrePartenaireEntity } from '../../../../../domain/organisations/entities';

@Injectable()
export class MembrePartenaireService {
  private readonly logger = new Logger(MembrePartenaireService.name);

  constructor(
    @InjectRepository(MembrePartenaireEntity)
    private readonly repository: Repository<MembrePartenaireEntity>,
  ) {}

  async create(input: {
    utilisateurId: string;
    partenaireId: string;
    roleId: string;
  }): Promise<MembrePartenaireEntity> {
    const existing = await this.repository.findOne({
      where: { utilisateurId: input.utilisateurId, partenaireId: input.partenaireId },
    });
    if (existing) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: `User is already a member of this partner`,
      });
    }

    const entity = this.repository.create({
      utilisateurId: input.utilisateurId,
      partenaireId: input.partenaireId,
      roleId: input.roleId,
    });
    return this.repository.save(entity);
  }

  async update(input: { id: string; roleId?: string }): Promise<MembrePartenaireEntity> {
    const entity = await this.findById(input.id);

    if (input.roleId !== undefined) entity.roleId = input.roleId;

    return this.repository.save(entity);
  }

  async findById(id: string): Promise<MembrePartenaireEntity> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['role', 'partenaire'],
    });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `MembrePartenaire ${id} not found` });
    }
    return entity;
  }

  async findByPartenaire(
    partenaireId: string,
    pagination?: { page?: number; limit?: number },
  ): Promise<{
    membres: MembrePartenaireEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;

    const [membres, total] = await this.repository.findAndCount({
      where: { partenaireId },
      relations: ['role'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { membres, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findByUtilisateur(
    utilisateurId: string,
    pagination?: { page?: number; limit?: number },
  ): Promise<{
    membres: MembrePartenaireEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;

    const [membres, total] = await this.repository.findAndCount({
      where: { utilisateurId },
      relations: ['role', 'partenaire'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { membres, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
