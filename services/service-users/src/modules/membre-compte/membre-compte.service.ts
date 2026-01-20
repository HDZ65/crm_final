import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { MembreCompteEntity } from './entities/membre-compte.entity';

@Injectable()
export class MembreCompteService {
  private readonly logger = new Logger(MembreCompteService.name);

  constructor(
    @InjectRepository(MembreCompteEntity)
    private readonly repository: Repository<MembreCompteEntity>,
  ) {}

  async create(input: {
    organisationId: string;
    utilisateurId: string;
    roleId: string;
    etat?: string;
  }): Promise<MembreCompteEntity> {
    const existing = await this.repository.findOne({
      where: { organisationId: input.organisationId, utilisateurId: input.utilisateurId },
    });
    if (existing) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: `User is already a member of this organisation`,
      });
    }

    const entity = this.repository.create({
      organisationId: input.organisationId,
      utilisateurId: input.utilisateurId,
      roleId: input.roleId,
      etat: input.etat || 'actif',
      dateInvitation: new Date(),
      dateActivation: input.etat === 'actif' ? new Date() : null,
    });
    return this.repository.save(entity);
  }

  async update(input: { id: string; roleId?: string; etat?: string }): Promise<MembreCompteEntity> {
    const entity = await this.findById(input.id);

    if (input.roleId !== undefined) entity.roleId = input.roleId;
    if (input.etat !== undefined) {
      entity.etat = input.etat;
      if (input.etat === 'actif' && !entity.dateActivation) {
        entity.dateActivation = new Date();
      }
    }

    return this.repository.save(entity);
  }

  async findById(id: string): Promise<MembreCompteEntity> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['utilisateur', 'role'],
    });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `MembreCompte ${id} not found` });
    }
    return entity;
  }

  async findByOrganisation(
    organisationId: string,
    pagination?: { page?: number; limit?: number },
  ): Promise<{
    membres: MembreCompteEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;

    const [membres, total] = await this.repository.findAndCount({
      where: { organisationId },
      relations: ['utilisateur', 'role'],
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
    membres: MembreCompteEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;

    const [membres, total] = await this.repository.findAndCount({
      where: { utilisateurId },
      relations: ['role'],
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
