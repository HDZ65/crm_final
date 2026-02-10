import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { UtilisateurEntity } from '../../../../../domain/users/entities';

@Injectable()
export class UtilisateurService {
  private readonly logger = new Logger(UtilisateurService.name);

  constructor(
    @InjectRepository(UtilisateurEntity)
    private readonly repository: Repository<UtilisateurEntity>,
  ) {}

  async create(input: {
    keycloakId: string;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    actif?: boolean;
  }): Promise<UtilisateurEntity> {
    const existing = await this.repository.findOne({
      where: [{ keycloakId: input.keycloakId }, { email: input.email }],
    });
    if (existing) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: `User with keycloakId ${input.keycloakId} or email ${input.email} already exists`,
      });
    }

    const entity = this.repository.create({
      keycloakId: input.keycloakId,
      nom: input.nom,
      prenom: input.prenom,
      email: input.email,
      telephone: input.telephone || null,
      actif: input.actif ?? true,
    });
    return this.repository.save(entity);
  }

  async update(input: {
    id: string;
    nom?: string;
    prenom?: string;
    email?: string;
    telephone?: string;
    actif?: boolean;
  }): Promise<UtilisateurEntity> {
    const entity = await this.findById(input.id);

    if (input.nom !== undefined) entity.nom = input.nom;
    if (input.prenom !== undefined) entity.prenom = input.prenom;
    if (input.email !== undefined) entity.email = input.email;
    if (input.telephone !== undefined) entity.telephone = input.telephone || null;
    if (input.actif !== undefined) entity.actif = input.actif;

    return this.repository.save(entity);
  }

  async findById(id: string): Promise<UtilisateurEntity> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Utilisateur ${id} not found` });
    }
    return entity;
  }

  async findByKeycloakId(keycloakId: string): Promise<UtilisateurEntity> {
    const entity = await this.repository.findOne({ where: { keycloakId } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Utilisateur with keycloakId ${keycloakId} not found` });
    }
    return entity;
  }

  async findByEmail(email: string): Promise<UtilisateurEntity> {
    const entity = await this.repository.findOne({ where: { email } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Utilisateur with email ${email} not found` });
    }
    return entity;
  }

  async findAll(
    filters?: { search?: string; actif?: boolean },
    pagination?: { page?: number; limit?: number },
  ): Promise<{
    utilisateurs: UtilisateurEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;

    const where: FindOptionsWhere<UtilisateurEntity>[] = [];

    if (filters?.search) {
      where.push(
        { nom: Like(`%${filters.search}%`) },
        { prenom: Like(`%${filters.search}%`) },
        { email: Like(`%${filters.search}%`) },
      );
    }

    const queryBuilder = this.repository.createQueryBuilder('u');

    if (filters?.search) {
      queryBuilder.where(
        '(u.nom ILIKE :search OR u.prenom ILIKE :search OR u.email ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.actif !== undefined) {
      queryBuilder.andWhere('u.actif = :actif', { actif: filters.actif });
    }

    const [utilisateurs, total] = await queryBuilder
      .orderBy('u.nom', 'ASC')
      .addOrderBy('u.prenom', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { utilisateurs, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
