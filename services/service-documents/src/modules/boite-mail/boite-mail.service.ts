import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoiteMail, Fournisseur } from './entities/boite-mail.entity';

@Injectable()
export class BoiteMailService {
  constructor(
    @InjectRepository(BoiteMail)
    private readonly boiteMailRepository: Repository<BoiteMail>,
  ) {}

  async create(data: Partial<BoiteMail>): Promise<BoiteMail> {
    const boiteMail = this.boiteMailRepository.create(data);
    return this.boiteMailRepository.save(boiteMail);
  }

  async update(id: string, data: Partial<BoiteMail>): Promise<BoiteMail> {
    const boiteMail = await this.findById(id);
    Object.assign(boiteMail, data);
    return this.boiteMailRepository.save(boiteMail);
  }

  async findById(id: string): Promise<BoiteMail> {
    const boiteMail = await this.boiteMailRepository.findOne({ where: { id } });
    if (!boiteMail) {
      throw new NotFoundException(`BoiteMail ${id} non trouvée`);
    }
    return boiteMail;
  }

  async findByUtilisateur(utilisateurId: string): Promise<BoiteMail> {
    const boiteMail = await this.boiteMailRepository.findOne({
      where: { utilisateurId, estParDefaut: true },
    });
    if (!boiteMail) {
      const anyBoite = await this.boiteMailRepository.findOne({
        where: { utilisateurId, actif: true },
      });
      if (!anyBoite) {
        throw new NotFoundException(`Aucune boîte mail pour utilisateur ${utilisateurId}`);
      }
      return anyBoite;
    }
    return boiteMail;
  }

  async findDefault(utilisateurId: string): Promise<BoiteMail> {
    const boiteMail = await this.boiteMailRepository.findOne({
      where: { utilisateurId, estParDefaut: true, actif: true },
    });
    if (!boiteMail) {
      throw new NotFoundException(`Aucune boîte mail par défaut pour utilisateur ${utilisateurId}`);
    }
    return boiteMail;
  }

  async findAll(
    filters?: { search?: string; fournisseur?: Fournisseur; actif?: boolean },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: BoiteMail[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.boiteMailRepository.createQueryBuilder('boite');

    if (filters?.search) {
      queryBuilder.andWhere(
        '(boite.nom ILIKE :search OR boite.adresseEmail ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.fournisseur) {
      queryBuilder.andWhere('boite.fournisseur = :fournisseur', {
        fournisseur: filters.fournisseur,
      });
    }

    if (filters?.actif !== undefined) {
      queryBuilder.andWhere('boite.actif = :actif', { actif: filters.actif });
    }

    queryBuilder.orderBy('boite.nom', 'ASC');
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

  async findByUtilisateurList(
    utilisateurId: string,
    actif?: boolean,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: BoiteMail[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.boiteMailRepository.createQueryBuilder('boite');
    queryBuilder.where('boite.utilisateurId = :utilisateurId', { utilisateurId });

    if (actif !== undefined) {
      queryBuilder.andWhere('boite.actif = :actif', { actif });
    }

    queryBuilder.orderBy('boite.estParDefaut', 'DESC');
    queryBuilder.addOrderBy('boite.nom', 'ASC');
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

  async setDefault(id: string, utilisateurId: string): Promise<BoiteMail> {
    // Retirer le défaut des autres boîtes
    await this.boiteMailRepository.update(
      { utilisateurId, estParDefaut: true },
      { estParDefaut: false },
    );

    // Définir la nouvelle par défaut
    const boiteMail = await this.findById(id);
    boiteMail.estParDefaut = true;
    return this.boiteMailRepository.save(boiteMail);
  }

  async activer(id: string): Promise<BoiteMail> {
    const boiteMail = await this.findById(id);
    boiteMail.actif = true;
    return this.boiteMailRepository.save(boiteMail);
  }

  async desactiver(id: string): Promise<BoiteMail> {
    const boiteMail = await this.findById(id);
    boiteMail.actif = false;
    return this.boiteMailRepository.save(boiteMail);
  }

  async updateOAuthTokens(
    id: string,
    accessToken: string,
    refreshToken: string,
    tokenExpiration: Date,
  ): Promise<BoiteMail> {
    const boiteMail = await this.findById(id);
    boiteMail.accessToken = accessToken;
    boiteMail.refreshToken = refreshToken;
    boiteMail.tokenExpiration = tokenExpiration;
    return this.boiteMailRepository.save(boiteMail);
  }

  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const boiteMail = await this.findById(id);

    // Basic validation
    if (boiteMail.isOAuth2()) {
      if (!boiteMail.accessToken) {
        return { success: false, message: 'Tokens OAuth2 non configurés' };
      }
      if (boiteMail.isTokenExpired()) {
        return { success: false, message: 'Token OAuth2 expiré' };
      }
      return { success: true, message: 'Configuration OAuth2 valide' };
    } else {
      if (!boiteMail.serveurSMTP || !boiteMail.portSMTP) {
        return { success: false, message: 'Configuration SMTP incomplète' };
      }
      if (!boiteMail.username || !boiteMail.motDePasse) {
        return { success: false, message: 'Identifiants manquants' };
      }
      return { success: true, message: 'Configuration SMTP/IMAP valide' };
    }
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.boiteMailRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
