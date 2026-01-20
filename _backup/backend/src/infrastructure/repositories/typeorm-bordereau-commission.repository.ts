import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BordereauCommissionEntity as BordereauCommissionOrmEntity } from '../db/entities/bordereau-commission.entity';
import { LigneBordereauEntity as LigneBordereauOrmEntity } from '../db/entities/ligne-bordereau.entity';
import { BordereauCommissionEntity } from '../../core/domain/bordereau-commission.entity';
import type {
  BordereauCommissionRepositoryPort,
  BordereauWithDetails,
} from '../../core/port/bordereau-commission-repository.port';
import { BordereauCommissionMapper } from '../../applications/mapper/bordereau-commission.mapper';

@Injectable()
export class TypeOrmBordereauCommissionRepository implements BordereauCommissionRepositoryPort {
  constructor(
    @InjectRepository(BordereauCommissionOrmEntity)
    private readonly repository: Repository<BordereauCommissionOrmEntity>,
    @InjectRepository(LigneBordereauOrmEntity)
    private readonly ligneRepository: Repository<LigneBordereauOrmEntity>,
  ) {}

  async create(
    entity: BordereauCommissionEntity,
  ): Promise<BordereauCommissionEntity> {
    const ormEntity = this.repository.create(
      BordereauCommissionMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return BordereauCommissionMapper.toDomain(saved);
  }

  async findById(id: string): Promise<BordereauCommissionEntity | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? BordereauCommissionMapper.toDomain(ormEntity) : null;
  }

  async findAll(): Promise<BordereauCommissionEntity[]> {
    const ormEntities = await this.repository.find({
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map(BordereauCommissionMapper.toDomain);
  }

  async update(
    id: string,
    entity: BordereauCommissionEntity,
  ): Promise<BordereauCommissionEntity> {
    await this.repository.update(
      id,
      BordereauCommissionMapper.toPersistence(entity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return BordereauCommissionMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByOrganisationId(
    organisationId: string,
  ): Promise<BordereauCommissionEntity[]> {
    const ormEntities = await this.repository.find({
      where: { organisationId },
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map(BordereauCommissionMapper.toDomain);
  }

  async findByApporteurId(
    apporteurId: string,
  ): Promise<BordereauCommissionEntity[]> {
    const ormEntities = await this.repository.find({
      where: { apporteurId },
      order: { periode: 'DESC' },
    });
    return ormEntities.map(BordereauCommissionMapper.toDomain);
  }

  async findByPeriode(periode: string): Promise<BordereauCommissionEntity[]> {
    const ormEntities = await this.repository.find({
      where: { periode },
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map(BordereauCommissionMapper.toDomain);
  }

  async findByReference(
    reference: string,
  ): Promise<BordereauCommissionEntity | null> {
    const ormEntity = await this.repository.findOne({ where: { reference } });
    return ormEntity ? BordereauCommissionMapper.toDomain(ormEntity) : null;
  }

  async findByStatut(statut: string): Promise<BordereauCommissionEntity[]> {
    const ormEntities = await this.repository.find({
      where: { statutBordereau: statut },
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map(BordereauCommissionMapper.toDomain);
  }

  async findByApporteurAndPeriode(
    apporteurId: string,
    periode: string,
  ): Promise<BordereauCommissionEntity | null> {
    const ormEntity = await this.repository.findOne({
      where: { apporteurId, periode },
    });
    return ormEntity ? BordereauCommissionMapper.toDomain(ormEntity) : null;
  }

  async findAllWithDetails(
    organisationId?: string,
  ): Promise<BordereauWithDetails[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.apporteur', 'apporteur');

    if (organisationId) {
      queryBuilder.where('b.organisation_id = :organisationId', {
        organisationId,
      });
    }

    queryBuilder.orderBy('b.created_at', 'DESC');

    const results = await queryBuilder.getMany();

    return results.map((b) => ({
      bordereau: BordereauCommissionMapper.toDomain(b),
      apporteur: b.apporteur
        ? {
            id: b.apporteur.id,
            nom: b.apporteur.nom,
            prenom: b.apporteur.prenom,
            typeApporteur: b.apporteur.typeApporteur,
          }
        : null,
    }));
  }

  async validerBordereau(
    id: string,
    validateurId: string,
  ): Promise<BordereauCommissionEntity> {
    await this.repository.update(id, {
      statutBordereau: 'valide',
      dateValidation: new Date(),
      validateurId,
      updatedAt: new Date(),
    });
    const updated = await this.repository.findOne({ where: { id } });
    return BordereauCommissionMapper.toDomain(updated!);
  }

  async exporterBordereau(
    id: string,
    pdfUrl: string | null,
    excelUrl: string | null,
  ): Promise<BordereauCommissionEntity> {
    await this.repository.update(id, {
      statutBordereau: 'exporte',
      dateExport: new Date(),
      fichierPdfUrl: pdfUrl,
      fichierExcelUrl: excelUrl,
      updatedAt: new Date(),
    });
    const updated = await this.repository.findOne({ where: { id } });
    return BordereauCommissionMapper.toDomain(updated!);
  }

  async recalculerTotaux(id: string): Promise<BordereauCommissionEntity> {
    // Récupérer les lignes sélectionnées
    const lignes = await this.ligneRepository.find({
      where: { bordereauId: id, selectionne: true },
    });

    let totalBrut = 0;
    let totalReprises = 0;

    for (const ligne of lignes) {
      totalBrut += Number(ligne.montantBrut);
      totalReprises += Number(ligne.montantReprise);
    }

    const totalNetAPayer = totalBrut - totalReprises;

    await this.repository.update(id, {
      totalBrut,
      totalReprises,
      totalNetAPayer,
      nombreLignes: lignes.length,
      updatedAt: new Date(),
    });

    const updated = await this.repository.findOne({ where: { id } });
    return BordereauCommissionMapper.toDomain(updated!);
  }
}
