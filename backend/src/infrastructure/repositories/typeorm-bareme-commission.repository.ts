import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull, Or } from 'typeorm';
import { BaremeCommissionEntity as BaremeCommissionOrmEntity } from '../db/entities/bareme-commission.entity';
import { BaremeCommissionEntity } from '../../core/domain/bareme-commission.entity';
import type { BaremeCommissionRepositoryPort } from '../../core/port/bareme-commission-repository.port';
import { BaremeCommissionMapper } from '../../applications/mapper/bareme-commission.mapper';

@Injectable()
export class TypeOrmBaremeCommissionRepository
  implements BaremeCommissionRepositoryPort
{
  constructor(
    @InjectRepository(BaremeCommissionOrmEntity)
    private readonly repository: Repository<BaremeCommissionOrmEntity>,
  ) {}

  async create(entity: BaremeCommissionEntity): Promise<BaremeCommissionEntity> {
    const ormEntity = this.repository.create(
      BaremeCommissionMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return BaremeCommissionMapper.toDomain(saved);
  }

  async findById(id: string): Promise<BaremeCommissionEntity | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? BaremeCommissionMapper.toDomain(ormEntity) : null;
  }

  async findAll(): Promise<BaremeCommissionEntity[]> {
    const ormEntities = await this.repository.find({
      order: { code: 'ASC', version: 'DESC' },
    });
    return ormEntities.map(BaremeCommissionMapper.toDomain);
  }

  async update(
    id: string,
    entity: BaremeCommissionEntity,
  ): Promise<BaremeCommissionEntity> {
    await this.repository.update(id, BaremeCommissionMapper.toPersistence(entity));
    const updated = await this.repository.findOne({ where: { id } });
    return BaremeCommissionMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByOrganisationId(
    organisationId: string,
  ): Promise<BaremeCommissionEntity[]> {
    const ormEntities = await this.repository.find({
      where: { organisationId },
      order: { code: 'ASC', version: 'DESC' },
    });
    return ormEntities.map(BaremeCommissionMapper.toDomain);
  }

  async findByCode(code: string): Promise<BaremeCommissionEntity | null> {
    const ormEntity = await this.repository.findOne({
      where: { code, actif: true },
      order: { version: 'DESC' },
    });
    return ormEntity ? BaremeCommissionMapper.toDomain(ormEntity) : null;
  }

  async findActifs(organisationId?: string): Promise<BaremeCommissionEntity[]> {
    const where: any = { actif: true };
    if (organisationId) {
      where.organisationId = organisationId;
    }
    const ormEntities = await this.repository.find({
      where,
      order: { code: 'ASC' },
    });
    return ormEntities.map(BaremeCommissionMapper.toDomain);
  }

  async findByTypeProduit(
    typeProduit: string,
  ): Promise<BaremeCommissionEntity[]> {
    const ormEntities = await this.repository.find({
      where: { typeProduit, actif: true },
      order: { code: 'ASC' },
    });
    return ormEntities.map(BaremeCommissionMapper.toDomain);
  }

  async findByProfilRemuneration(
    profil: string,
  ): Promise<BaremeCommissionEntity[]> {
    const ormEntities = await this.repository.find({
      where: { profilRemuneration: profil, actif: true },
      order: { code: 'ASC' },
    });
    return ormEntities.map(BaremeCommissionMapper.toDomain);
  }

  async findApplicable(
    organisationId: string,
    typeProduit?: string,
    profilRemuneration?: string,
    date?: Date,
  ): Promise<BaremeCommissionEntity | null> {
    const dateRef = date || new Date();

    const queryBuilder = this.repository
      .createQueryBuilder('b')
      .where('b.organisation_id = :organisationId', { organisationId })
      .andWhere('b.actif = :actif', { actif: true })
      .andWhere('b.date_effet <= :dateRef', { dateRef })
      .andWhere('(b.date_fin IS NULL OR b.date_fin >= :dateRef)', { dateRef });

    if (typeProduit) {
      queryBuilder.andWhere(
        '(b.type_produit = :typeProduit OR b.type_produit IS NULL)',
        { typeProduit },
      );
    }

    if (profilRemuneration) {
      queryBuilder.andWhere(
        '(b.profil_remuneration = :profilRemuneration OR b.profil_remuneration IS NULL)',
        { profilRemuneration },
      );
    }

    queryBuilder.orderBy('b.version', 'DESC').limit(1);

    const ormEntity = await queryBuilder.getOne();
    return ormEntity ? BaremeCommissionMapper.toDomain(ormEntity) : null;
  }

  async creerNouvelleVersion(
    baremeId: string,
    modifications: Partial<BaremeCommissionEntity>,
    modifiePar: string,
    motif: string,
  ): Promise<BaremeCommissionEntity> {
    const existant = await this.repository.findOne({ where: { id: baremeId } });
    if (!existant) {
      throw new Error('Barème non trouvé');
    }

    // Désactiver l'ancienne version
    await this.repository.update(baremeId, {
      actif: false,
      dateFin: new Date(),
    });

    // Créer nouvelle version
    const nouvelleVersion = this.repository.create({
      ...existant,
      ...modifications,
      id: undefined, // Nouveau UUID
      version: existant.version + 1,
      actif: true,
      dateFin: null,
      modifiePar,
      motifModification: motif,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await this.repository.save(nouvelleVersion);
    return BaremeCommissionMapper.toDomain(saved);
  }
}
