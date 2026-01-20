import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BordereauCommissionEntity, StatutBordereau } from './entities/bordereau-commission.entity';

@Injectable()
export class BordereauService {
  private readonly logger = new Logger(BordereauService.name);

  constructor(
    @InjectRepository(BordereauCommissionEntity)
    private readonly bordereauRepository: Repository<BordereauCommissionEntity>,
  ) {}

  async create(data: Partial<BordereauCommissionEntity>): Promise<BordereauCommissionEntity> {
    const bordereau = this.bordereauRepository.create({
      ...data,
      statutBordereau: StatutBordereau.BROUILLON,
    });
    const saved = await this.bordereauRepository.save(bordereau);
    this.logger.log(`Created bordereau ${saved.id}`);
    return saved;
  }

  async findById(id: string): Promise<BordereauCommissionEntity> {
    const bordereau = await this.bordereauRepository.findOne({
      where: { id },
      relations: ['lignes'],
    });
    if (!bordereau) {
      throw new NotFoundException(`Bordereau ${id} not found`);
    }
    return bordereau;
  }

  async findByOrganisation(
    organisationId: string,
    options?: {
      apporteurId?: string;
      periode?: string;
      statut?: StatutBordereau;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ bordereaux: BordereauCommissionEntity[]; total: number }> {
    const qb = this.bordereauRepository
      .createQueryBuilder('b')
      .where('b.organisation_id = :organisationId', { organisationId });

    if (options?.apporteurId) {
      qb.andWhere('b.apporteur_id = :apporteurId', { apporteurId: options.apporteurId });
    }
    if (options?.periode) {
      qb.andWhere('b.periode = :periode', { periode: options.periode });
    }
    if (options?.statut) {
      qb.andWhere('b.statut_bordereau = :statut', { statut: options.statut });
    }

    qb.orderBy('b.periode', 'DESC').addOrderBy('b.created_at', 'DESC');

    const total = await qb.getCount();

    if (options?.limit) qb.take(options.limit);
    if (options?.offset) qb.skip(options.offset);

    const bordereaux = await qb.getMany();
    return { bordereaux, total };
  }

  async findByApporteurAndPeriode(
    organisationId: string,
    apporteurId: string,
    periode: string,
  ): Promise<BordereauCommissionEntity | null> {
    return this.bordereauRepository.findOne({
      where: { organisationId, apporteurId, periode },
      relations: ['lignes'],
    });
  }

  async update(id: string, data: Partial<BordereauCommissionEntity>): Promise<BordereauCommissionEntity> {
    const bordereau = await this.findById(id);
    Object.assign(bordereau, data);
    return this.bordereauRepository.save(bordereau);
  }

  async validate(id: string, validateurId: string): Promise<BordereauCommissionEntity> {
    const bordereau = await this.findById(id);
    bordereau.statutBordereau = StatutBordereau.VALIDE;
    bordereau.validateurId = validateurId;
    bordereau.dateValidation = new Date();
    return this.bordereauRepository.save(bordereau);
  }

  async export(id: string): Promise<BordereauCommissionEntity> {
    const bordereau = await this.findById(id);
    bordereau.statutBordereau = StatutBordereau.EXPORTE;
    bordereau.dateExport = new Date();
    // In real implementation, generate PDF/Excel and update URLs
    bordereau.fichierPdfUrl = `/exports/bordereaux/${id}.pdf`;
    bordereau.fichierExcelUrl = `/exports/bordereaux/${id}.xlsx`;
    return this.bordereauRepository.save(bordereau);
  }

  async updateTotals(id: string, totals: {
    totalBrut: number;
    totalReprises: number;
    totalAcomptes: number;
    totalNetAPayer: number;
    nombreLignes: number;
  }): Promise<void> {
    await this.bordereauRepository.update(id, totals);
  }

  async delete(id: string): Promise<void> {
    const bordereau = await this.findById(id);
    await this.bordereauRepository.remove(bordereau);
    this.logger.log(`Deleted bordereau ${id}`);
  }
}
