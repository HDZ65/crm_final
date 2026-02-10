import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FactureEntity } from '../../../../../domain/factures/entities/facture.entity';
import { LigneFactureEntity } from '../../../../../domain/factures/entities/ligne-facture.entity';
import { FactureService } from './facture.service';

const DEFAULT_TVA_RATE = 20;

interface LigneFactureMetadata extends Record<string, unknown> {
  serviceCode?: string;
  prixCatalogueUnitaire?: number;
  bundleDiscountApplied?: boolean;
}

interface NormalizedServicePricing {
  produitId: string | null;
  serviceCode: string | null;
  prixUnitaire: number;
  prixCatalogueUnitaire: number | null;
  tauxTVA: number | null;
}

export interface ConsolidatedBillingLineInput {
  serviceCode: string;
  produitId: string;
  quantite?: number;
  prixUnitaire: number;
  prixCatalogueUnitaire?: number;
  tauxTVA?: number;
  description?: string;
}

export interface CreateRecurringConsolidatedFactureInput {
  organisationId: string;
  dateEmission: Date;
  statutId: string;
  emissionFactureId: string;
  clientBaseId: string;
  contratId?: string;
  clientPartenaireId: string;
  adresseFacturationId: string;
  services: ConsolidatedBillingLineInput[];
}

export interface BundlePriceRecalculatedServiceInput {
  produitId?: string;
  produit_id?: string;
  serviceCode?: string;
  service_code?: string;
  prixUnitaire?: number;
  prix_unitaire?: number;
  prixCatalogueUnitaire?: number;
  prix_catalogue_unitaire?: number;
  tauxTVA?: number;
  taux_tva?: number;
}

export interface BundlePriceRecalculatedPayload {
  factureId?: string;
  facture_id?: string;
  organisationId?: string;
  organisation_id?: string;
  clientBaseId?: string;
  client_id?: string;
  contratId?: string;
  contrat_id?: string;
  services?: BundlePriceRecalculatedServiceInput[];
  lines?: BundlePriceRecalculatedServiceInput[];
}

export interface RemoveBundleDiscountsInput {
  organisationId: string;
  clientBaseId: string;
  factureId?: string;
  contratId?: string;
  services?: BundlePriceRecalculatedServiceInput[];
}

export interface RemoveBundleDiscountsResult {
  factureId: string | null;
  updatedLines: number;
}

@Injectable()
export class ConsolidatedBillingService {
  private readonly logger = new Logger(ConsolidatedBillingService.name);

  constructor(
    private readonly factureService: FactureService,
    @InjectRepository(FactureEntity)
    private readonly factureRepository: Repository<FactureEntity>,
    @InjectRepository(LigneFactureEntity)
    private readonly ligneRepository: Repository<LigneFactureEntity>,
  ) {}

  async createRecurringConsolidatedFacture(
    input: CreateRecurringConsolidatedFactureInput,
  ): Promise<FactureEntity> {
    if (!input.services || input.services.length === 0) {
      throw new Error('At least one service line is required for recurring billing');
    }

    if (input.services.length > 3) {
      throw new Error('Consolidated recurring billing supports at most three services per invoice');
    }

    return this.factureService.create({
      organisationId: input.organisationId,
      dateEmission: input.dateEmission,
      statutId: input.statutId,
      emissionFactureId: input.emissionFactureId,
      clientBaseId: input.clientBaseId,
      contratId: input.contratId,
      clientPartenaireId: input.clientPartenaireId,
      adresseFacturationId: input.adresseFacturationId,
      lignes: input.services.map((service) => this.toCreateLine(service)),
    });
  }

  async handleBundlePriceRecalculated(
    payload: BundlePriceRecalculatedPayload,
  ): Promise<FactureEntity | null> {
    const facture = await this.resolveFactureForBundleEvent(payload);
    if (!facture) {
      return null;
    }

    const pricingEntries = this.normalizePricingEntries(
      payload.services ?? payload.lines ?? [],
    );

    if (pricingEntries.length === 0) {
      this.logger.warn(
        `bundle.price.recalculated ignored for facture ${facture.id}: no pricing lines provided`,
      );
      return facture;
    }

    const lignes =
      facture.lignes && facture.lignes.length > 0
        ? facture.lignes
        : await this.ligneRepository.find({
            where: { factureId: facture.id },
            order: { ordreAffichage: 'ASC' },
          });

    const pricingByProduitId = new Map<string, NormalizedServicePricing>();
    const pricingByServiceCode = new Map<string, NormalizedServicePricing>();
    for (const entry of pricingEntries) {
      if (entry.produitId) {
        pricingByProduitId.set(entry.produitId, entry);
      }

      if (entry.serviceCode) {
        pricingByServiceCode.set(entry.serviceCode, entry);
      }
    }

    let updatedLines = 0;

    for (const ligne of lignes) {
      const metadata = this.toLineMetadata(ligne.metadata);
      const serviceCode = this.extractServiceCode(ligne, metadata);
      const pricing =
        pricingByProduitId.get(ligne.produitId) ??
        (serviceCode ? pricingByServiceCode.get(serviceCode) : undefined);

      if (!pricing) {
        continue;
      }

      const tauxTVA = pricing.tauxTVA ?? this.toNumber(ligne.tauxTVA) ?? DEFAULT_TVA_RATE;
      const amounts = LigneFactureEntity.calculateAmounts(
        ligne.quantite,
        pricing.prixUnitaire,
        tauxTVA,
      );

      const previousPrice = this.roundCurrency(Number(ligne.prixUnitaire));
      ligne.prixUnitaire = this.roundCurrency(pricing.prixUnitaire);
      ligne.tauxTVA = this.roundCurrency(tauxTVA);
      ligne.montantHT = amounts.montantHT;
      ligne.montantTVA = amounts.montantTVA;
      ligne.montantTTC = amounts.montantTTC;
      ligne.metadata = {
        ...metadata,
        serviceCode: pricing.serviceCode ?? serviceCode,
        prixCatalogueUnitaire:
          pricing.prixCatalogueUnitaire ?? metadata.prixCatalogueUnitaire ?? previousPrice,
        bundleDiscountApplied:
          (pricing.prixCatalogueUnitaire ?? metadata.prixCatalogueUnitaire ?? previousPrice) >
          pricing.prixUnitaire,
        previousPrixUnitaire: previousPrice,
        lastBundleRecalculatedAt: new Date().toISOString(),
      };

      updatedLines += 1;
    }

    if (updatedLines === 0) {
      this.logger.log(
        `bundle.price.recalculated matched no ligne_facture for facture ${facture.id}`,
      );
      return facture;
    }

    await this.ligneRepository.save(lignes);
    await this.refreshFactureTotals(facture, lignes);

    this.logger.log(
      `bundle.price.recalculated applied on facture ${facture.id}: ${updatedLines} lines updated`,
    );

    return this.factureService.findById(facture.id);
  }

  async removeBundleDiscountsForClient(
    input: RemoveBundleDiscountsInput,
  ): Promise<RemoveBundleDiscountsResult> {
    const facture = await this.resolveFactureForDiscountReset(input);
    if (!facture) {
      return {
        factureId: null,
        updatedLines: 0,
      };
    }

    const lignes =
      facture.lignes && facture.lignes.length > 0
        ? facture.lignes
        : await this.ligneRepository.find({
            where: { factureId: facture.id },
            order: { ordreAffichage: 'ASC' },
          });

    const pricingEntries = this.normalizePricingEntries(input.services ?? []);
    const pricingByProduitId = new Map<string, NormalizedServicePricing>();
    const pricingByServiceCode = new Map<string, NormalizedServicePricing>();

    for (const entry of pricingEntries) {
      if (entry.produitId) {
        pricingByProduitId.set(entry.produitId, entry);
      }

      if (entry.serviceCode) {
        pricingByServiceCode.set(entry.serviceCode, entry);
      }
    }

    let updatedLines = 0;

    for (const ligne of lignes) {
      const metadata = this.toLineMetadata(ligne.metadata);
      const serviceCode = this.extractServiceCode(ligne, metadata);
      if (serviceCode === 'CONCIERGERIE') {
        continue;
      }

      const pricing =
        pricingByProduitId.get(ligne.produitId) ??
        (serviceCode ? pricingByServiceCode.get(serviceCode) : undefined);
      const prixCatalogue =
        pricing?.prixUnitaire ?? this.toNumber(metadata.prixCatalogueUnitaire);

      if (!prixCatalogue) {
        continue;
      }

      const currentPrice = this.roundCurrency(Number(ligne.prixUnitaire));
      const targetPrice = this.roundCurrency(prixCatalogue);
      if (targetPrice <= currentPrice) {
        continue;
      }

      const tauxTVA = pricing?.tauxTVA ?? this.toNumber(ligne.tauxTVA) ?? DEFAULT_TVA_RATE;
      const amounts = LigneFactureEntity.calculateAmounts(
        ligne.quantite,
        targetPrice,
        tauxTVA,
      );

      ligne.prixUnitaire = targetPrice;
      ligne.tauxTVA = this.roundCurrency(tauxTVA);
      ligne.montantHT = amounts.montantHT;
      ligne.montantTVA = amounts.montantTVA;
      ligne.montantTTC = amounts.montantTTC;
      ligne.metadata = {
        ...metadata,
        serviceCode,
        prixCatalogueUnitaire: targetPrice,
        bundleDiscountApplied: false,
        discountRemovedAt: new Date().toISOString(),
      };

      updatedLines += 1;
    }

    if (updatedLines === 0) {
      return {
        factureId: facture.id,
        updatedLines: 0,
      };
    }

    await this.ligneRepository.save(lignes);
    await this.refreshFactureTotals(facture, lignes);

    return {
      factureId: facture.id,
      updatedLines,
    };
  }

  private toCreateLine(service: ConsolidatedBillingLineInput) {
    const serviceCode = this.normalizeServiceCode(service.serviceCode);
    if (!serviceCode) {
      throw new Error('serviceCode is required for consolidated billing lines');
    }

    const quantite = service.quantite ?? 1;
    const prixUnitaire = this.roundCurrency(service.prixUnitaire);
    const prixCatalogueUnitaire = this.roundCurrency(
      service.prixCatalogueUnitaire ?? service.prixUnitaire,
    );

    return {
      produitId: service.produitId,
      quantite,
      prixUnitaire,
      description: this.toDescription(serviceCode, service.description),
      tauxTVA: service.tauxTVA ?? DEFAULT_TVA_RATE,
      metadata: {
        serviceCode,
        prixCatalogueUnitaire,
        bundleDiscountApplied: prixCatalogueUnitaire > prixUnitaire,
      },
    };
  }

  private async resolveFactureForBundleEvent(
    payload: BundlePriceRecalculatedPayload,
  ): Promise<FactureEntity | null> {
    const factureId = payload.factureId ?? payload.facture_id;
    if (factureId) {
      return this.factureRepository.findOne({
        where: { id: factureId },
        relations: ['lignes', 'statut'],
      });
    }

    const organisationId = payload.organisationId ?? payload.organisation_id;
    const clientBaseId = payload.clientBaseId ?? payload.client_id;
    const contratId = payload.contratId ?? payload.contrat_id;

    if (!organisationId || !clientBaseId) {
      return null;
    }

    const whereClause: Record<string, unknown> = {
      organisationId,
      clientBaseId,
    };

    if (contratId) {
      whereClause.contratId = contratId;
    }

    const candidates = await this.factureRepository.find({
      where: whereClause,
      order: {
        dateEmission: 'DESC',
        createdAt: 'DESC',
      },
      relations: ['lignes', 'statut'],
      take: 10,
    });

    const editableFacture = candidates.find(
      (candidate) => candidate.numero === null || candidate.estBrouillon(),
    );

    return editableFacture ?? candidates[0] ?? null;
  }

  private async resolveFactureForDiscountReset(
    input: RemoveBundleDiscountsInput,
  ): Promise<FactureEntity | null> {
    if (input.factureId) {
      return this.factureRepository.findOne({
        where: { id: input.factureId },
        relations: ['lignes', 'statut'],
      });
    }

    const whereClause: Record<string, unknown> = {
      organisationId: input.organisationId,
      clientBaseId: input.clientBaseId,
    };

    if (input.contratId) {
      whereClause.contratId = input.contratId;
    }

    const candidates = await this.factureRepository.find({
      where: whereClause,
      order: {
        dateEmission: 'DESC',
        createdAt: 'DESC',
      },
      relations: ['lignes', 'statut'],
      take: 10,
    });

    const editableFacture = candidates.find(
      (candidate) => candidate.numero === null || candidate.estBrouillon(),
    );

    return editableFacture ?? candidates[0] ?? null;
  }

  private normalizePricingEntries(
    entries: BundlePriceRecalculatedServiceInput[],
  ): NormalizedServicePricing[] {
    const normalized: NormalizedServicePricing[] = [];

    for (const entry of entries) {
      const candidate = entry as Record<string, unknown>;
      const prixUnitaire = this.toNumber(candidate.prixUnitaire ?? candidate.prix_unitaire);

      if (prixUnitaire === null) {
        continue;
      }

      const produitId = this.toOptionalString(candidate.produitId ?? candidate.produit_id);
      const serviceCode = this.normalizeServiceCode(
        this.toOptionalString(candidate.serviceCode ?? candidate.service_code),
      );
      const prixCatalogueUnitaire = this.toNumber(
        candidate.prixCatalogueUnitaire ?? candidate.prix_catalogue_unitaire,
      );
      const tauxTVA = this.toNumber(candidate.tauxTVA ?? candidate.taux_tva);

      normalized.push({
        produitId,
        serviceCode,
        prixUnitaire: this.roundCurrency(prixUnitaire),
        prixCatalogueUnitaire:
          prixCatalogueUnitaire === null ? null : this.roundCurrency(prixCatalogueUnitaire),
        tauxTVA,
      });
    }

    return normalized;
  }

  private extractServiceCode(
    ligne: LigneFactureEntity,
    metadata: LigneFactureMetadata,
  ): string | null {
    const metadataServiceCode = this.toOptionalString(metadata.serviceCode);
    if (metadataServiceCode) {
      return this.normalizeServiceCode(metadataServiceCode);
    }

    if (ligne.description && ligne.description.includes(':')) {
      const firstSegment = ligne.description.split(':')[0];
      return this.normalizeServiceCode(firstSegment);
    }

    return null;
  }

  private toDescription(serviceCode: string, description?: string): string {
    if (description && description.trim().length > 0) {
      return description.trim();
    }

    return `Service ${serviceCode.replaceAll('_', ' ')}`;
  }

  private async refreshFactureTotals(
    facture: FactureEntity,
    lignes: LigneFactureEntity[],
  ): Promise<void> {
    const totals = FactureEntity.calculateTotalsFromLines(lignes);
    facture.montantHT = totals.montantHT;
    facture.montantTTC = totals.montantTTC;
    await this.factureRepository.save(facture);
  }

  private toLineMetadata(metadata: unknown): LigneFactureMetadata {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return {};
    }

    return { ...(metadata as LigneFactureMetadata) };
  }

  private normalizeServiceCode(serviceCode?: string | null): string | null {
    if (!serviceCode) {
      return null;
    }

    const trimmed = serviceCode.trim();
    if (!trimmed) {
      return null;
    }

    return trimmed.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  }

  private toOptionalString(value: unknown): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const stringValue = String(value).trim();
    return stringValue.length > 0 ? stringValue : null;
  }

  private toNumber(value: unknown): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
