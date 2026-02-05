import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FactureEntity } from '../facture/entities/facture.entity';
import { FactureSettingsEntity } from '../facture-settings/entities/facture-settings.entity';

interface LigneInput {
  quantite: number;
  prixUnitaire: number;
  tauxTVA?: number;
}

interface CalculatedTotals {
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
}

@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);

  constructor(
    @InjectRepository(FactureEntity)
    private readonly factureRepository: Repository<FactureEntity>,
    @InjectRepository(FactureSettingsEntity)
    private readonly settingsRepository: Repository<FactureSettingsEntity>,
  ) {}

  async generateNextNumero(organisationId: string, societeId: string): Promise<string> {
    this.logger.log(`Generating next numero for org ${organisationId}, societe ${societeId}`);

    // Get settings for prefix
    const settings = await this.settingsRepository.findOne({ where: { societeId } });
    const prefix = settings?.invoicePrefix || 'FAC';

    // Get current year
    const year = new Date().getFullYear();

    // Find the last invoice number for this year and organisation
    const lastFacture = await this.factureRepository
      .createQueryBuilder('f')
      .where('f.organisationId = :orgId', { orgId: organisationId })
      .andWhere('f.numero IS NOT NULL')
      .andWhere('f.numero LIKE :pattern', { pattern: `${prefix}${year}%` })
      .orderBy('f.numero', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastFacture?.numero) {
      // Extract the sequence number from the last invoice
      const match = lastFacture.numero.match(/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    // Format: PREFIX + YEAR + SEQUENCE (padded to 6 digits)
    const sequence = nextNumber.toString().padStart(6, '0');
    const numero = `${prefix}${year}${sequence}`;

    this.logger.log(`Generated numero: ${numero}`);
    return numero;
  }

  calculateTotals(lignes: LigneInput[]): CalculatedTotals {
    let montantHT = 0;
    let montantTVA = 0;

    for (const ligne of lignes) {
      const ht = ligne.quantite * ligne.prixUnitaire;
      const tva = ht * ((ligne.tauxTVA ?? 20) / 100);
      montantHT += ht;
      montantTVA += tva;
    }

    const montantTTC = montantHT + montantTVA;

    return {
      montantHT: Math.round(montantHT * 100) / 100,
      montantTVA: Math.round(montantTVA * 100) / 100,
      montantTTC: Math.round(montantTTC * 100) / 100,
    };
  }

  calculateLineAmounts(quantite: number, prixUnitaire: number, tauxTVA: number = 20): CalculatedTotals {
    const montantHT = quantite * prixUnitaire;
    const montantTVA = montantHT * (tauxTVA / 100);
    const montantTTC = montantHT + montantTVA;

    return {
      montantHT: Math.round(montantHT * 100) / 100,
      montantTVA: Math.round(montantTVA * 100) / 100,
      montantTTC: Math.round(montantTTC * 100) / 100,
    };
  }
}
