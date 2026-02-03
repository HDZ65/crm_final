import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull, Or } from 'typeorm';
import { BaremeCommissionEntity } from './entities/bareme-commission.entity';

@Injectable()
export class BaremeService {
  private readonly logger = new Logger(BaremeService.name);

  constructor(
    @InjectRepository(BaremeCommissionEntity)
    private readonly baremeRepository: Repository<BaremeCommissionEntity>,
  ) {}

  async create(data: Partial<BaremeCommissionEntity>): Promise<BaremeCommissionEntity> {
    const bareme = this.baremeRepository.create({ ...data, actif: true });
    const saved = await this.baremeRepository.save(bareme);
    this.logger.log(`Created bareme ${saved.id}`);
    return saved;
  }

  async findById(id: string): Promise<BaremeCommissionEntity> {
    const bareme = await this.baremeRepository.findOne({
      where: { id },
      relations: ['paliers'],
    });
    if (!bareme) {
      throw new NotFoundException(`Bareme ${id} not found`);
    }
    return bareme;
  }

  async findByOrganisation(
    organisationId: string,
    options?: {
      actifOnly?: boolean;
      typeProduit?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ baremes: BaremeCommissionEntity[]; total: number }> {
    const qb = this.baremeRepository
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.paliers', 'paliers')
      .where('b.organisation_id = :organisationId', { organisationId });

    if (options?.actifOnly) {
      qb.andWhere('b.actif = true');
    }
    if (options?.typeProduit) {
      qb.andWhere('b.type_produit = :typeProduit', { typeProduit: options.typeProduit });
    }

    qb.orderBy('b.nom', 'ASC');

    const total = await qb.getCount();

    if (options?.limit) qb.take(options.limit);
    if (options?.offset) qb.skip(options.offset);

    const baremes = await qb.getMany();
    return { baremes, total };
  }

  async findApplicable(
    organisationId: string,
    options: {
      typeProduit?: string;
      profilRemuneration?: string;
      societeId?: string;
      canalVente?: string;
      date: string;
    },
  ): Promise<BaremeCommissionEntity | null> {
    const dateObj = new Date(options.date);

    const qb = this.baremeRepository
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.paliers', 'paliers')
      .where('b.organisation_id = :organisationId', { organisationId })
      .andWhere('b.actif = true')
      .andWhere('b.date_effet <= :date', { date: dateObj })
      .andWhere('(b.date_fin IS NULL OR b.date_fin >= :date)', { date: dateObj });

    if (options.typeProduit) {
      qb.andWhere('(b.type_produit IS NULL OR b.type_produit = :typeProduit)', {
        typeProduit: options.typeProduit,
      });
    }
    if (options.profilRemuneration) {
      qb.andWhere('(b.profil_remuneration IS NULL OR b.profil_remuneration = :profil)', {
        profil: options.profilRemuneration,
      });
    }
    if (options.societeId) {
      qb.andWhere('(b.societe_id IS NULL OR b.societe_id = :societeId)', {
        societeId: options.societeId,
      });
    }
    if (options.canalVente) {
      qb.andWhere('(b.canal_vente IS NULL OR b.canal_vente = :canalVente)', {
        canalVente: options.canalVente,
      });
    }

    qb.orderBy('b.version', 'DESC');

    return qb.getOne();
  }

  async update(id: string, data: Partial<BaremeCommissionEntity>): Promise<BaremeCommissionEntity> {
    const bareme = await this.findById(id);
    Object.assign(bareme, data);
    return this.baremeRepository.save(bareme);
  }

  async delete(id: string): Promise<void> {
    const bareme = await this.findById(id);
    await this.baremeRepository.remove(bareme);
    this.logger.log(`Deleted bareme ${id}`);
  }
}
