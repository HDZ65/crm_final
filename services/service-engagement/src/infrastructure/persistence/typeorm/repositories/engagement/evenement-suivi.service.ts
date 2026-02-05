import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvenementSuiviEntity } from '../../../../../domain/engagement/entities';

@Injectable()
export class EvenementSuiviService {
  constructor(
    @InjectRepository(EvenementSuiviEntity)
    private readonly evenementSuiviRepository: Repository<EvenementSuiviEntity>,
  ) {}

  async create(data: Partial<EvenementSuiviEntity>): Promise<EvenementSuiviEntity> {
    const evenement = this.evenementSuiviRepository.create(data);
    return this.evenementSuiviRepository.save(evenement);
  }

  async update(id: string, data: Partial<EvenementSuiviEntity>): Promise<EvenementSuiviEntity> {
    const evenement = await this.findById(id);
    Object.assign(evenement, data);
    return this.evenementSuiviRepository.save(evenement);
  }

  async findById(id: string): Promise<EvenementSuiviEntity> {
    const evenement = await this.evenementSuiviRepository.findOne({ where: { id } });
    if (!evenement) {
      throw new NotFoundException(`EvenementSuivi ${id} non trouvé`);
    }
    return evenement;
  }

  async findByExpedition(
    expeditionId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: EvenementSuiviEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.evenementSuiviRepository.findAndCount({
      where: { expeditionId },
      skip,
      take: limit,
      order: { dateEvenement: 'DESC' },
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
    filters?: { search?: string },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: EvenementSuiviEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.evenementSuiviRepository.createQueryBuilder('evenement');

    if (filters?.search) {
      queryBuilder.andWhere(
        '(evenement.code ILIKE :search OR evenement.label ILIKE :search OR evenement.lieu ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    queryBuilder.orderBy('evenement.dateEvenement', 'DESC');
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
    const result = await this.evenementSuiviRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
