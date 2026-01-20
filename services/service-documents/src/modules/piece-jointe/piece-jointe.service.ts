import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PieceJointe } from './entities/piece-jointe.entity';

@Injectable()
export class PieceJointeService {
  constructor(
    @InjectRepository(PieceJointe)
    private readonly pieceJointeRepository: Repository<PieceJointe>,
  ) {}

  async create(data: Partial<PieceJointe>): Promise<PieceJointe> {
    const pieceJointe = this.pieceJointeRepository.create({
      ...data,
      dateUpload: new Date(),
    });
    return this.pieceJointeRepository.save(pieceJointe);
  }

  async update(id: string, data: Partial<PieceJointe>): Promise<PieceJointe> {
    const pieceJointe = await this.findById(id);
    Object.assign(pieceJointe, data);
    return this.pieceJointeRepository.save(pieceJointe);
  }

  async findById(id: string): Promise<PieceJointe> {
    const pieceJointe = await this.pieceJointeRepository.findOne({ where: { id } });
    if (!pieceJointe) {
      throw new NotFoundException(`PieceJointe ${id} non trouvée`);
    }
    return pieceJointe;
  }

  async findAll(
    filters?: { search?: string; typeMime?: string },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: PieceJointe[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.pieceJointeRepository.createQueryBuilder('piece');

    if (filters?.search) {
      queryBuilder.andWhere('piece.nomFichier ILIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    if (filters?.typeMime) {
      queryBuilder.andWhere('piece.typeMime = :typeMime', { typeMime: filters.typeMime });
    }

    queryBuilder.orderBy('piece.dateUpload', 'DESC');
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

  async findByEntite(
    entiteType: string,
    entiteId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: PieceJointe[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.pieceJointeRepository.findAndCount({
      where: { entiteType, entiteId },
      skip,
      take: limit,
      order: { dateUpload: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pieceJointeRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
