import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull, Or } from 'typeorm';
import { BaremeCommission } from './entities/bareme-commission.entity';

@Injectable()
export class BaremeCommissionService {
  constructor(
    @InjectRepository(BaremeCommission)
    private readonly baremeRepository: Repository<BaremeCommission>,
  ) {}

  async create(data: Partial<BaremeCommission>): Promise<BaremeCommission> {
    const bareme = this.baremeRepository.create(data);
    return this.baremeRepository.save(bareme);
  }

  async update(id: string, data: Partial<BaremeCommission>): Promise<BaremeCommission> {
    const bareme = await this.findById(id);

    // Incrémenter la version si modifications majeures
    if (data.typeCalcul || data.montantFixe || data.tauxPourcentage) {
      bareme.version = (bareme.version || 1) + 1;
    }

    Object.assign(bareme, data);
    return this.baremeRepository.save(bareme);
  }

  async findById(id: string): Promise<BaremeCommission> {
    const bareme = await this.baremeRepository.findOne({ where: { id } });
    if (!bareme) {
      throw new NotFoundException(`BaremeCommission ${id} non trouvé`);
    }
    return bareme;
  }

  async findByCode(code: string): Promise<BaremeCommission> {
    const bareme = await this.baremeRepository.findOne({ where: { code } });
    if (!bareme) {
      throw new NotFoundException(`BaremeCommission avec code ${code} non trouvé`);
    }
    return bareme;
  }

  async findAll(
    filters?: { search?: string; typeCalcul?: string; canalVente?: string; actif?: boolean },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: BaremeCommission[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.baremeRepository.createQueryBuilder('bareme');

    if (filters?.search) {
      queryBuilder.andWhere(
        '(bareme.code ILIKE :search OR bareme.nom ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.typeCalcul) {
      queryBuilder.andWhere('bareme.typeCalcul = :typeCalcul', { typeCalcul: filters.typeCalcul });
    }

    if (filters?.canalVente) {
      queryBuilder.andWhere('bareme.canalVente = :canalVente', { canalVente: filters.canalVente });
    }

    if (filters?.actif !== undefined) {
      queryBuilder.andWhere('bareme.actif = :actif', { actif: filters.actif });
    }

    queryBuilder.orderBy('bareme.nom', 'ASC');
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
    data: BaremeCommission[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.baremeRepository.createQueryBuilder('bareme');
    queryBuilder.where('bareme.organisationId = :organisationId', { organisationId });

    if (actif !== undefined) {
      queryBuilder.andWhere('bareme.actif = :actif', { actif });
    }

    queryBuilder.orderBy('bareme.nom', 'ASC');
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

  async findActifs(
    organisationId: string,
    date: Date,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: BaremeCommission[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.baremeRepository.createQueryBuilder('bareme');
    queryBuilder.where('bareme.organisationId = :organisationId', { organisationId });
    queryBuilder.andWhere('bareme.actif = true');
    queryBuilder.andWhere('bareme.dateEffet <= :date', { date });
    queryBuilder.andWhere('(bareme.dateFin IS NULL OR bareme.dateFin >= :date)', { date });
    queryBuilder.orderBy('bareme.nom', 'ASC');
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

  async findWithPaliers(id: string): Promise<BaremeCommission> {
    const bareme = await this.baremeRepository.findOne({
      where: { id },
      relations: ['paliers'],
    });
    if (!bareme) {
      throw new NotFoundException(`BaremeCommission ${id} non trouvé`);
    }
    return bareme;
  }

  async activer(id: string): Promise<BaremeCommission> {
    const bareme = await this.findById(id);
    bareme.actif = true;
    return this.baremeRepository.save(bareme);
  }

  async desactiver(id: string): Promise<BaremeCommission> {
    const bareme = await this.findById(id);
    bareme.actif = false;
    return this.baremeRepository.save(bareme);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.baremeRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
