import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository} from 'typeorm';
import { Activite } from './entities/activite.entity';

@Injectable()
export class ActiviteService {
  constructor(
    @InjectRepository(Activite)
    private readonly activiteRepository: Repository<Activite>,
  ) {}

  async create(data: Partial<Activite>): Promise<Activite> {
    const activite = this.activiteRepository.create(data);
    return this.activiteRepository.save(activite);
  }

  async update(id: string, data: Partial<Activite>): Promise<Activite> {
    const activite = await this.findById(id);
    Object.assign(activite, data);
    return this.activiteRepository.save(activite);
  }

  async findById(id: string): Promise<Activite> {
    const activite = await this.activiteRepository.findOne({
      where: { id },
      relations: ['type'],
    });
    if (!activite) {
      throw new NotFoundException(`Activite ${id} non trouvée`);
    }
    return activite;
  }

  async findByClient(
    clientBaseId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: Activite[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.activiteRepository.findAndCount({
      where: { clientBaseId },
      relations: ['type'],
      skip,
      take: limit,
      order: { dateActivite: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByContrat(
    contratId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: Activite[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.activiteRepository.findAndCount({
      where: { contratId },
      relations: ['type'],
      skip,
      take: limit,
      order: { dateActivite: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAll(
    filters?: { search?: string; typeId?: string },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: Activite[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.activiteRepository
      .createQueryBuilder('activite')
      .leftJoinAndSelect('activite.type', 'type');

    if (filters?.search) {
      queryBuilder.andWhere(
        '(activite.sujet ILIKE :search OR activite.commentaire ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.typeId) {
      queryBuilder.andWhere('activite.typeId = :typeId', { typeId: filters.typeId });
    }

    queryBuilder.orderBy('activite.dateActivite', 'DESC');
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

  async delete(id: string): Promise<boolean> {
    const result = await this.activiteRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
