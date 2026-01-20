import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import type {
  CreateStatutFactureRequest,
  UpdateStatutFactureRequest,
  GetStatutFactureRequest,
  GetStatutFactureByCodeRequest,
  ListStatutsFactureRequest,
  ListStatutsFactureResponse,
  DeleteStatutFactureRequest,
  DeleteStatutFactureResponse,
  StatutFacture,
  CreateEmissionFactureRequest,
  UpdateEmissionFactureRequest,
  GetEmissionFactureRequest,
  ListEmissionsFactureRequest,
  ListEmissionsFactureResponse,
  DeleteEmissionFactureRequest,
  DeleteEmissionFactureResponse,
  EmissionFacture,
  CreateLigneFactureRequest,
  UpdateLigneFactureRequest,
  GetLigneFactureRequest,
  ListLignesFactureRequest,
  ListLignesFactureResponse,
  DeleteLigneFactureRequest,
  DeleteLigneFactureResponse,
  LigneFacture,
  CreateFactureRequest,
  UpdateFactureRequest,
  GetFactureRequest,
  GetFactureByNumeroRequest,
  ListFacturesRequest,
  ListFacturesResponse,
  DeleteFactureRequest,
  DeleteFactureResponse,
  ValidateFactureRequest,
  ValidateFactureResponse,
  FinalizeFactureRequest,
  Facture,
  CreateFactureSettingsRequest,
  UpdateFactureSettingsRequest,
  GetFactureSettingsRequest,
  GetFactureSettingsBySocieteRequest,
  DeleteFactureSettingsRequest,
  DeleteFactureSettingsResponse,
  UploadLogoRequest,
  FactureSettings,
  GenerateNextNumeroRequest,
  GenerateNextNumeroResponse,
  CalculateTotalsRequest,
  CalculateTotalsResponse,
} from '@proto/factures/factures';

import { StatutFactureService } from './modules/statut-facture/statut-facture.service';
import { EmissionFactureService } from './modules/emission-facture/emission-facture.service';
import { LigneFactureService } from './modules/ligne-facture/ligne-facture.service';
import { FactureService } from './modules/facture/facture.service';
import { FactureSettingsService } from './modules/facture-settings/facture-settings.service';
import { GenerationService } from './modules/generation/generation.service';

// ===== Helper functions =====

function toProtoDate(date: Date | null | undefined): string {
  return date ? date.toISOString() : '';
}

function fromProtoDate(dateStr: string | null | undefined): Date | undefined {
  return dateStr ? new Date(dateStr) : undefined;
}

@Controller()
export class FacturesController {
  constructor(
    private readonly statutService: StatutFactureService,
    private readonly emissionService: EmissionFactureService,
    private readonly ligneService: LigneFactureService,
    private readonly factureService: FactureService,
    private readonly settingsService: FactureSettingsService,
    private readonly generationService: GenerationService,
  ) {}

  // ===== STATUT FACTURE =====

  @GrpcMethod('StatutFactureService', 'Create')
  async createStatut(data: CreateStatutFactureRequest): Promise<StatutFacture> {
    const entity = await this.statutService.create({
      code: data.code,
      nom: data.nom,
      description: data.description,
      ordreAffichage: data.ordreAffichage,
    });
    return this.mapStatut(entity);
  }

  @GrpcMethod('StatutFactureService', 'Update')
  async updateStatut(data: UpdateStatutFactureRequest): Promise<StatutFacture> {
    const entity = await this.statutService.update({
      id: data.id,
      code: data.code,
      nom: data.nom,
      description: data.description,
      ordreAffichage: data.ordreAffichage,
    });
    return this.mapStatut(entity);
  }

  @GrpcMethod('StatutFactureService', 'Get')
  async getStatut(data: GetStatutFactureRequest): Promise<StatutFacture> {
    const entity = await this.statutService.findById(data.id);
    return this.mapStatut(entity);
  }

  @GrpcMethod('StatutFactureService', 'GetByCode')
  async getStatutByCode(data: GetStatutFactureByCodeRequest): Promise<StatutFacture> {
    const entity = await this.statutService.findByCode(data.code);
    return this.mapStatut(entity);
  }

  @GrpcMethod('StatutFactureService', 'List')
  async listStatuts(data: ListStatutsFactureRequest): Promise<ListStatutsFactureResponse> {
    const result = await this.statutService.findAll({
      page: data.pagination?.page,
      limit: data.pagination?.limit,
    });
    return {
      statuts: result.statuts.map((s) => this.mapStatut(s)),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('StatutFactureService', 'Delete')
  async deleteStatut(data: DeleteStatutFactureRequest): Promise<DeleteStatutFactureResponse> {
    const success = await this.statutService.delete(data.id);
    return { success };
  }

  private mapStatut(entity: any): StatutFacture {
    return {
      id: entity.id,
      code: entity.code,
      nom: entity.nom,
      description: entity.description || '',
      ordreAffichage: entity.ordreAffichage || 0,
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
    };
  }

  // ===== EMISSION FACTURE =====

  @GrpcMethod('EmissionFactureService', 'Create')
  async createEmission(data: CreateEmissionFactureRequest): Promise<EmissionFacture> {
    const entity = await this.emissionService.create({
      code: data.code,
      nom: data.nom,
      description: data.description,
    });
    return this.mapEmission(entity);
  }

  @GrpcMethod('EmissionFactureService', 'Update')
  async updateEmission(data: UpdateEmissionFactureRequest): Promise<EmissionFacture> {
    const entity = await this.emissionService.update({
      id: data.id,
      code: data.code,
      nom: data.nom,
      description: data.description,
    });
    return this.mapEmission(entity);
  }

  @GrpcMethod('EmissionFactureService', 'Get')
  async getEmission(data: GetEmissionFactureRequest): Promise<EmissionFacture> {
    const entity = await this.emissionService.findById(data.id);
    return this.mapEmission(entity);
  }

  @GrpcMethod('EmissionFactureService', 'List')
  async listEmissions(data: ListEmissionsFactureRequest): Promise<ListEmissionsFactureResponse> {
    const result = await this.emissionService.findAll({
      page: data.pagination?.page,
      limit: data.pagination?.limit,
    });
    return {
      emissions: result.emissions.map((e) => this.mapEmission(e)),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('EmissionFactureService', 'Delete')
  async deleteEmission(data: DeleteEmissionFactureRequest): Promise<DeleteEmissionFactureResponse> {
    const success = await this.emissionService.delete(data.id);
    return { success };
  }

  private mapEmission(entity: any): EmissionFacture {
    return {
      id: entity.id,
      code: entity.code,
      nom: entity.nom,
      description: entity.description || '',
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
    };
  }

  // ===== LIGNE FACTURE =====

  @GrpcMethod('LigneFactureService', 'Create')
  async createLigne(data: CreateLigneFactureRequest): Promise<LigneFacture> {
    const entity = await this.ligneService.create({
      factureId: data.factureId,
      produitId: data.produitId,
      quantite: data.quantite,
      prixUnitaire: data.prixUnitaire,
      description: data.description,
      tauxTVA: data.tauxTva,
      ordreAffichage: data.ordreAffichage,
    });
    return this.mapLigne(entity);
  }

  @GrpcMethod('LigneFactureService', 'Update')
  async updateLigne(data: UpdateLigneFactureRequest): Promise<LigneFacture> {
    const entity = await this.ligneService.update({
      id: data.id,
      produitId: data.produitId,
      quantite: data.quantite,
      prixUnitaire: data.prixUnitaire,
      description: data.description,
      tauxTVA: data.tauxTva,
      ordreAffichage: data.ordreAffichage,
    });
    return this.mapLigne(entity);
  }

  @GrpcMethod('LigneFactureService', 'Get')
  async getLigne(data: GetLigneFactureRequest): Promise<LigneFacture> {
    const entity = await this.ligneService.findById(data.id);
    return this.mapLigne(entity);
  }

  @GrpcMethod('LigneFactureService', 'List')
  async listLignes(data: ListLignesFactureRequest): Promise<ListLignesFactureResponse> {
    const result = await this.ligneService.findByFacture(data.factureId, {
      page: data.pagination?.page,
      limit: data.pagination?.limit,
    });
    return {
      lignes: result.lignes.map((l) => this.mapLigne(l)),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('LigneFactureService', 'Delete')
  async deleteLigne(data: DeleteLigneFactureRequest): Promise<DeleteLigneFactureResponse> {
    const success = await this.ligneService.delete(data.id);
    return { success };
  }

  private mapLigne(entity: any): LigneFacture {
    return {
      id: entity.id,
      factureId: entity.factureId,
      produitId: entity.produitId,
      quantite: entity.quantite,
      prixUnitaire: entity.prixUnitaire,
      description: entity.description || '',
      montantHt: entity.montantHT,
      tauxTva: entity.tauxTVA,
      montantTva: entity.montantTVA,
      montantTtc: entity.montantTTC,
      ordreAffichage: entity.ordreAffichage || 0,
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
    };
  }

  // ===== FACTURE =====

  @GrpcMethod('FactureService', 'Create')
  async createFacture(data: CreateFactureRequest): Promise<Facture> {
    const entity = await this.factureService.create({
      organisationId: data.organisationId,
      dateEmission: fromProtoDate(data.dateEmission)!,
      statutId: data.statutId,
      emissionFactureId: data.emissionFactureId,
      clientBaseId: data.clientBaseId,
      contratId: data.contratId,
      clientPartenaireId: data.clientPartenaireId,
      adresseFacturationId: data.adresseFacturationId,
      lignes: data.lignes?.map((l) => ({
        produitId: l.produitId,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        description: l.description,
        tauxTVA: l.tauxTva,
      })),
    });
    return this.mapFacture(entity);
  }

  @GrpcMethod('FactureService', 'Update')
  async updateFacture(data: UpdateFactureRequest): Promise<Facture> {
    const entity = await this.factureService.update({
      id: data.id,
      dateEmission: fromProtoDate(data.dateEmission),
      statutId: data.statutId,
      emissionFactureId: data.emissionFactureId,
      adresseFacturationId: data.adresseFacturationId,
    });
    return this.mapFacture(entity);
  }

  @GrpcMethod('FactureService', 'Get')
  async getFacture(data: GetFactureRequest): Promise<Facture> {
    const entity = await this.factureService.findById(data.id);
    return this.mapFacture(entity);
  }

  @GrpcMethod('FactureService', 'GetByNumero')
  async getFactureByNumero(data: GetFactureByNumeroRequest): Promise<Facture> {
    const entity = await this.factureService.findByNumero(data.organisationId, data.numero);
    return this.mapFacture(entity);
  }

  @GrpcMethod('FactureService', 'List')
  async listFactures(data: ListFacturesRequest): Promise<ListFacturesResponse> {
    const result = await this.factureService.findAll({
      organisationId: data.organisationId,
      clientBaseId: data.clientBaseId,
      contratId: data.contratId,
      statutId: data.statutId,
      dateFrom: fromProtoDate(data.dateFrom),
      dateTo: fromProtoDate(data.dateTo),
      pagination: {
        page: data.pagination?.page,
        limit: data.pagination?.limit,
        sortBy: data.pagination?.sortBy,
        sortOrder: data.pagination?.sortOrder,
      },
    });
    return {
      factures: result.factures.map((f) => this.mapFacture(f)),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('FactureService', 'Delete')
  async deleteFacture(data: DeleteFactureRequest): Promise<DeleteFactureResponse> {
    const success = await this.factureService.delete(data.id);
    return { success };
  }

  @GrpcMethod('FactureService', 'Validate')
  async validateFacture(data: ValidateFactureRequest): Promise<ValidateFactureResponse> {
    const result = await this.factureService.validate(data.id);
    return {
      valid: result.valid,
      errors: result.errors,
      facture: this.mapFacture(result.facture),
    };
  }

  @GrpcMethod('FactureService', 'Finalize')
  async finalizeFacture(data: FinalizeFactureRequest): Promise<Facture> {
    const facture = await this.factureService.findById(data.id);
    const numero = await this.generationService.generateNextNumero(
      facture.organisationId,
      facture.organisationId,
    );
    const entity = await this.factureService.finalize(data.id, numero);
    return this.mapFacture(entity);
  }

  private mapFacture(entity: any): Facture {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      numero: entity.numero || '',
      dateEmission: toProtoDate(entity.dateEmission),
      montantHt: entity.montantHT,
      montantTtc: entity.montantTTC,
      statutId: entity.statutId,
      emissionFactureId: entity.emissionFactureId,
      clientBaseId: entity.clientBaseId,
      contratId: entity.contratId || '',
      clientPartenaireId: entity.clientPartenaireId,
      adresseFacturationId: entity.adresseFacturationId,
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
      statut: entity.statut ? this.mapStatut(entity.statut) : undefined,
      lignes: entity.lignes?.map((l: any) => this.mapLigne(l)) || [],
    };
  }

  // ===== FACTURE SETTINGS =====

  @GrpcMethod('FactureSettingsService', 'Create')
  async createSettings(data: CreateFactureSettingsRequest): Promise<FactureSettings> {
    const entity = await this.settingsService.create({
      societeId: data.societeId,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      companyName: data.companyName,
      companyAddress: data.companyAddress,
      companyPhone: data.companyPhone,
      companyEmail: data.companyEmail,
      companySiret: data.companySiret,
      companyTvaNumber: data.companyTvaNumber,
      companyRcs: data.companyRcs,
      companyCapital: data.companyCapital,
      iban: data.iban,
      bic: data.bic,
      bankName: data.bankName,
      headerText: data.headerText,
      footerText: data.footerText,
      legalMentions: data.legalMentions,
      paymentTerms: data.paymentTerms,
      invoicePrefix: data.invoicePrefix,
      showLogo: data.showLogo,
      logoPosition: data.logoPosition as any,
    });
    return this.mapSettings(entity);
  }

  @GrpcMethod('FactureSettingsService', 'Update')
  async updateSettings(data: UpdateFactureSettingsRequest): Promise<FactureSettings> {
    const entity = await this.settingsService.update({
      id: data.id,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      companyName: data.companyName,
      companyAddress: data.companyAddress,
      companyPhone: data.companyPhone,
      companyEmail: data.companyEmail,
      companySiret: data.companySiret,
      companyTvaNumber: data.companyTvaNumber,
      companyRcs: data.companyRcs,
      companyCapital: data.companyCapital,
      iban: data.iban,
      bic: data.bic,
      bankName: data.bankName,
      headerText: data.headerText,
      footerText: data.footerText,
      legalMentions: data.legalMentions,
      paymentTerms: data.paymentTerms,
      invoicePrefix: data.invoicePrefix,
      showLogo: data.showLogo,
      logoPosition: data.logoPosition as any,
    });
    return this.mapSettings(entity);
  }

  @GrpcMethod('FactureSettingsService', 'Get')
  async getSettings(data: GetFactureSettingsRequest): Promise<FactureSettings> {
    const entity = await this.settingsService.findById(data.id);
    return this.mapSettings(entity);
  }

  @GrpcMethod('FactureSettingsService', 'GetBySociete')
  async getSettingsBySociete(data: GetFactureSettingsBySocieteRequest): Promise<FactureSettings> {
    const entity = await this.settingsService.findBySociete(data.societeId);
    return this.mapSettings(entity);
  }

  @GrpcMethod('FactureSettingsService', 'Delete')
  async deleteSettings(data: DeleteFactureSettingsRequest): Promise<DeleteFactureSettingsResponse> {
    const success = await this.settingsService.delete(data.id);
    return { success };
  }

  @GrpcMethod('FactureSettingsService', 'UploadLogo')
  async uploadLogo(data: UploadLogoRequest): Promise<FactureSettings> {
    const entity = await this.settingsService.uploadLogo(
      data.settingsId,
      data.logoBase64,
      data.logoMimeType,
    );
    return this.mapSettings(entity);
  }

  private mapSettings(entity: any): FactureSettings {
    return {
      id: entity.id,
      societeId: entity.societeId,
      logoBase64: entity.logoBase64 || '',
      logoMimeType: entity.logoMimeType || '',
      primaryColor: entity.primaryColor || '',
      secondaryColor: entity.secondaryColor || '',
      companyName: entity.companyName || '',
      companyAddress: entity.companyAddress || '',
      companyPhone: entity.companyPhone || '',
      companyEmail: entity.companyEmail || '',
      companySiret: entity.companySiret || '',
      companyTvaNumber: entity.companyTvaNumber || '',
      companyRcs: entity.companyRcs || '',
      companyCapital: entity.companyCapital || '',
      iban: entity.iban || '',
      bic: entity.bic || '',
      bankName: entity.bankName || '',
      headerText: entity.headerText || '',
      footerText: entity.footerText || '',
      legalMentions: entity.legalMentions || '',
      paymentTerms: entity.paymentTerms || '',
      invoicePrefix: entity.invoicePrefix || '',
      showLogo: entity.showLogo ?? true,
      logoPosition: entity.logoPosition || 'left',
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
    };
  }

  // ===== GENERATION =====

  @GrpcMethod('FactureGenerationService', 'GenerateNextNumero')
  async generateNextNumero(data: GenerateNextNumeroRequest): Promise<GenerateNextNumeroResponse> {
    const numero = await this.generationService.generateNextNumero(
      data.organisationId,
      data.societeId,
    );
    return { numero };
  }

  @GrpcMethod('FactureGenerationService', 'CalculateTotals')
  async calculateTotals(data: CalculateTotalsRequest): Promise<CalculateTotalsResponse> {
    const totals = this.generationService.calculateTotals(
      data.lignes.map((l) => ({
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        tauxTVA: l.tauxTva,
      })),
    );
    return {
      montantHt: totals.montantHT,
      montantTva: totals.montantTVA,
      montantTtc: totals.montantTTC,
    };
  }
}
