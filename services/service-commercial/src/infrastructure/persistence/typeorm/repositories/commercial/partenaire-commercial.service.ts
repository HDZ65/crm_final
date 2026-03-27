import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import {
  PartenaireCommercialEntity,
  TypePartenaire,
  StatutPartenaire,
} from '../../../../../domain/commercial/entities/partenaire-commercial.entity';
import { PartenaireCommercialSocieteEntity } from '../../../../../domain/commercial/entities/partenaire-commercial-societe.entity';
import { IPartenaireCommercialRepository } from '../../../../../domain/commercial/repositories/IPartenaireCommercialRepository';

@Injectable()
export class PartenaireCommercialService implements IPartenaireCommercialRepository {
  constructor(
    @InjectRepository(PartenaireCommercialEntity)
    private readonly partenaireRepository: Repository<PartenaireCommercialEntity>,
    @InjectRepository(PartenaireCommercialSocieteEntity)
    private readonly partenaireSocieteRepository: Repository<PartenaireCommercialSocieteEntity>,
  ) {}

  async findById(id: string): Promise<PartenaireCommercialEntity | null> {
    return this.partenaireRepository.findOne({
      where: { id },
      relations: ['societes'],
    });
  }

  async findByOrganisation(
    organisationId: string,
    filters?: {
      type?: TypePartenaire;
      statut?: StatutPartenaire;
      search?: string;
    },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: PartenaireCommercialEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const qb = this.partenaireRepository.createQueryBuilder('p');
    qb.where('p.organisationId = :organisationId', { organisationId });

    if (filters?.type) {
      qb.andWhere('p.type = :type', { type: filters.type });
    }

    if (filters?.statut) {
      qb.andWhere('p.statut = :statut', { statut: filters.statut });
    }

    if (filters?.search) {
      qb.andWhere(
        '(p.denomination ILIKE :search OR p.siren ILIKE :search OR p.siret ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    qb.leftJoinAndSelect('p.societes', 'societes');
    qb.orderBy('p.denomination', 'ASC');
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async save(data: Partial<PartenaireCommercialEntity>): Promise<PartenaireCommercialEntity> {
    // Check uniqueness (organisationId + denomination)
    if (data.organisationId && data.denomination) {
      const existing = await this.partenaireRepository
        .createQueryBuilder('p')
        .where('p.organisationId = :orgId', { orgId: data.organisationId })
        .andWhere('LOWER(p.denomination) = LOWER(:denomination)', {
          denomination: data.denomination,
        })
        .getOne();

      if (existing) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: `Un partenaire "${data.denomination}" existe déjà pour cette organisation`,
        });
      }
    }

    const entity = this.partenaireRepository.create(data);
    return this.partenaireRepository.save(entity);
  }

  async update(
    id: string,
    data: Partial<PartenaireCommercialEntity>,
  ): Promise<PartenaireCommercialEntity> {
    const existing = await this.partenaireRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Partenaire commercial ${id} non trouvé`);
    }

    // Check denomination uniqueness on update if denomination changed
    if (data.denomination && data.denomination !== existing.denomination) {
      const duplicate = await this.partenaireRepository
        .createQueryBuilder('p')
        .where('p.organisationId = :orgId', { orgId: existing.organisationId })
        .andWhere('LOWER(p.denomination) = LOWER(:denomination)', {
          denomination: data.denomination,
        })
        .andWhere('p.id != :id', { id })
        .getOne();

      if (duplicate) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: `Un partenaire "${data.denomination}" existe déjà pour cette organisation`,
        });
      }
    }

    Object.assign(existing, data);
    return this.partenaireRepository.save(existing);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.partenaireRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  // --- Société Activation ---

  async findSocietesByPartenaire(
    partenaireId: string,
  ): Promise<PartenaireCommercialSocieteEntity[]> {
    return this.partenaireSocieteRepository.find({
      where: { partenaireId },
    });
  }

  async activerSociete(
    partenaireId: string,
    societeId: string,
  ): Promise<PartenaireCommercialSocieteEntity> {
    let link = await this.partenaireSocieteRepository.findOne({
      where: { partenaireId, societeId },
    });

    if (link) {
      link.actif = true;
      link.dateActivation = new Date();
      link.dateDesactivation = null;
      return this.partenaireSocieteRepository.save(link);
    }

    link = this.partenaireSocieteRepository.create({
      partenaireId,
      societeId,
      actif: true,
      dateActivation: new Date(),
    });
    return this.partenaireSocieteRepository.save(link);
  }

  async desactiverSociete(
    partenaireId: string,
    societeId: string,
  ): Promise<PartenaireCommercialSocieteEntity> {
    const link = await this.partenaireSocieteRepository.findOne({
      where: { partenaireId, societeId },
    });

    if (!link) {
      throw new NotFoundException(
        `Lien partenaire ${partenaireId} / société ${societeId} non trouvé`,
      );
    }

    link.actif = false;
    link.dateDesactivation = new Date();
    return this.partenaireSocieteRepository.save(link);
  }
}
