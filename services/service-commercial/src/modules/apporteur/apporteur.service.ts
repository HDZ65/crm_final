import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { Apporteur } from './entities/apporteur.entity';

@Injectable()
export class ApporteurService {
  constructor(
    @InjectRepository(Apporteur)
    private readonly apporteurRepository: Repository<Apporteur>,
  ) {}

  async create(data: Partial<Apporteur>): Promise<Apporteur> {
    // Check if apporteur with same name already exists in organisation
    if (data.organisationId && data.nom && data.prenom) {
      const existing = await this.apporteurRepository
        .createQueryBuilder('a')
        .where('a.organisationId = :orgId', { orgId: data.organisationId })
        .andWhere('LOWER(a.nom) = LOWER(:nom)', { nom: data.nom })
        .andWhere('LOWER(a.prenom) = LOWER(:prenom)', { prenom: data.prenom })
        .getOne();

      if (existing) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: `Un commercial "${data.prenom} ${data.nom}" existe déjà`,
        });
      }
    }

    // Check if email already exists in organisation (if provided)
    if (data.organisationId && data.email) {
      const existingEmail = await this.apporteurRepository
        .createQueryBuilder('a')
        .where('a.organisationId = :orgId', { orgId: data.organisationId })
        .andWhere('LOWER(a.email) = LOWER(:email)', { email: data.email })
        .getOne();

      if (existingEmail) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: `Un commercial avec l'email "${data.email}" existe déjà`,
        });
      }
    }

    const apporteur = this.apporteurRepository.create(data);
    return this.apporteurRepository.save(apporteur);
  }

  async update(id: string, data: Partial<Apporteur>): Promise<Apporteur> {
    const apporteur = await this.findById(id);
    Object.assign(apporteur, data);
    return this.apporteurRepository.save(apporteur);
  }

  async findById(id: string): Promise<Apporteur> {
    const apporteur = await this.apporteurRepository.findOne({ where: { id } });
    if (!apporteur) {
      throw new NotFoundException(`Apporteur ${id} non trouvé`);
    }
    return apporteur;
  }

  async findByUtilisateur(utilisateurId: string): Promise<Apporteur> {
    const apporteur = await this.apporteurRepository.findOne({ where: { utilisateurId } });
    if (!apporteur) {
      throw new NotFoundException(`Apporteur pour utilisateur ${utilisateurId} non trouvé`);
    }
    return apporteur;
  }

  async findAll(
    filters?: { search?: string; typeApporteur?: string; actif?: boolean },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: Apporteur[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.apporteurRepository.createQueryBuilder('apporteur');

    if (filters?.search) {
      queryBuilder.andWhere(
        '(apporteur.nom ILIKE :search OR apporteur.prenom ILIKE :search OR apporteur.email ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.typeApporteur) {
      queryBuilder.andWhere('apporteur.typeApporteur = :typeApporteur', {
        typeApporteur: filters.typeApporteur,
      });
    }

    if (filters?.actif !== undefined) {
      queryBuilder.andWhere('apporteur.actif = :actif', { actif: filters.actif });
    }

    queryBuilder.orderBy('apporteur.nom', 'ASC');
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByOrganisation(
    organisationId: string,
    actif?: boolean,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: Apporteur[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.apporteurRepository.createQueryBuilder('apporteur');
    queryBuilder.where('apporteur.organisationId = :organisationId', { organisationId });

    if (actif !== undefined) {
      queryBuilder.andWhere('apporteur.actif = :actif', { actif });
    }

    queryBuilder.orderBy('apporteur.nom', 'ASC');
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async activer(id: string): Promise<Apporteur> {
    const apporteur = await this.findById(id);
    apporteur.actif = true;
    return this.apporteurRepository.save(apporteur);
  }

  async desactiver(id: string): Promise<Apporteur> {
    const apporteur = await this.findById(id);
    apporteur.actif = false;
    return this.apporteurRepository.save(apporteur);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.apporteurRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
