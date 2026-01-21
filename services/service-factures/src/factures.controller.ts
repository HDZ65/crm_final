import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import type {
  CreateStatutFactureRequest,
  UpdateStatutFactureRequest,
  GetStatutFactureRequest,
  GetStatutFactureByCodeRequest,
  ListStatutsFactureRequest,
  DeleteStatutFactureRequest,
  CreateEmissionFactureRequest,
  UpdateEmissionFactureRequest,
  GetEmissionFactureRequest,
  ListEmissionsFactureRequest,
  DeleteEmissionFactureRequest,
  CreateLigneFactureRequest,
  UpdateLigneFactureRequest,
  GetLigneFactureRequest,
  ListLignesFactureRequest,
  DeleteLigneFactureRequest,
  CreateFactureRequest,
  UpdateFactureRequest,
  GetFactureRequest,
  GetFactureByNumeroRequest,
  ListFacturesRequest,
  DeleteFactureRequest,
  ValidateFactureRequest,
  FinalizeFactureRequest,
  CreateFactureSettingsRequest,
  UpdateFactureSettingsRequest,
  GetFactureSettingsRequest,
  GetFactureSettingsBySocieteRequest,
  DeleteFactureSettingsRequest,
  UploadLogoRequest,
  GenerateNextNumeroRequest,
  CalculateTotalsRequest,
} from '@proto/factures/factures';

import { StatutFactureService } from './modules/statut-facture/statut-facture.service';
import { EmissionFactureService } from './modules/emission-facture/emission-facture.service';
import { LigneFactureService } from './modules/ligne-facture/ligne-facture.service';
import { FactureService } from './modules/facture/facture.service';
import { FactureSettingsService } from './modules/facture-settings/facture-settings.service';
import { GenerationService } from './modules/generation/generation.service';
import { LigneFactureEntity } from './modules/ligne-facture/entities/ligne-facture.entity';
import { FactureEntity } from './modules/facture/entities/facture.entity';

// ===== Field name conversion helpers (entity uses HT/TTC/TVA, proto uses Ht/Ttc/Tva) =====

function mapLigne(entity: LigneFactureEntity) {
  return {
    id: entity.id,
    factureId: entity.factureId,
    produitId: entity.produitId,
    quantite: entity.quantite,
    prixUnitaire: entity.prixUnitaire,
    description: entity.description ?? '',
    montantHt: entity.montantHT,
    tauxTva: entity.tauxTVA,
    montantTva: entity.montantTVA,
    montantTtc: entity.montantTTC,
    ordreAffichage: entity.ordreAffichage,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

function mapFacture(entity: FactureEntity) {
  return {
    id: entity.id,
    organisationId: entity.organisationId,
    numero: entity.numero ?? '',
    dateEmission: entity.dateEmission,
    montantHt: entity.montantHT,
    montantTtc: entity.montantTTC,
    statutId: entity.statutId,
    emissionFactureId: entity.emissionFactureId,
    clientBaseId: entity.clientBaseId,
    contratId: entity.contratId ?? '',
    clientPartenaireId: entity.clientPartenaireId,
    adresseFacturationId: entity.adresseFacturationId,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    statut: entity.statut,
    lignes: entity.lignes?.map(mapLigne) ?? [],
  };
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
  async createStatut(data: CreateStatutFactureRequest) {
    return this.statutService.create({
      code: data.code,
      nom: data.nom,
      description: data.description,
      ordreAffichage: data.ordreAffichage,
    });
  }

  @GrpcMethod('StatutFactureService', 'Update')
  async updateStatut(data: UpdateStatutFactureRequest) {
    return this.statutService.update({
      id: data.id,
      code: data.code,
      nom: data.nom,
      description: data.description,
      ordreAffichage: data.ordreAffichage,
    });
  }

  @GrpcMethod('StatutFactureService', 'Get')
  async getStatut(data: GetStatutFactureRequest) {
    return this.statutService.findById(data.id);
  }

  @GrpcMethod('StatutFactureService', 'GetByCode')
  async getStatutByCode(data: GetStatutFactureByCodeRequest) {
    return this.statutService.findByCode(data.code);
  }

  @GrpcMethod('StatutFactureService', 'List')
  async listStatuts(data: ListStatutsFactureRequest) {
    return this.statutService.findAll({
      page: data.pagination?.page,
      limit: data.pagination?.limit,
    });
  }

  @GrpcMethod('StatutFactureService', 'Delete')
  async deleteStatut(data: DeleteStatutFactureRequest) {
    const success = await this.statutService.delete(data.id);
    return { success };
  }

  // ===== EMISSION FACTURE =====

  @GrpcMethod('EmissionFactureService', 'Create')
  async createEmission(data: CreateEmissionFactureRequest) {
    return this.emissionService.create({
      code: data.code,
      nom: data.nom,
      description: data.description,
    });
  }

  @GrpcMethod('EmissionFactureService', 'Update')
  async updateEmission(data: UpdateEmissionFactureRequest) {
    return this.emissionService.update({
      id: data.id,
      code: data.code,
      nom: data.nom,
      description: data.description,
    });
  }

  @GrpcMethod('EmissionFactureService', 'Get')
  async getEmission(data: GetEmissionFactureRequest) {
    return this.emissionService.findById(data.id);
  }

  @GrpcMethod('EmissionFactureService', 'List')
  async listEmissions(data: ListEmissionsFactureRequest) {
    return this.emissionService.findAll({
      page: data.pagination?.page,
      limit: data.pagination?.limit,
    });
  }

  @GrpcMethod('EmissionFactureService', 'Delete')
  async deleteEmission(data: DeleteEmissionFactureRequest) {
    const success = await this.emissionService.delete(data.id);
    return { success };
  }

  // ===== LIGNE FACTURE =====

  @GrpcMethod('LigneFactureService', 'Create')
  async createLigne(data: CreateLigneFactureRequest) {
    const entity = await this.ligneService.create(data);
    return mapLigne(entity);
  }

  @GrpcMethod('LigneFactureService', 'Update')
  async updateLigne(data: UpdateLigneFactureRequest) {
    const entity = await this.ligneService.update({
      id: data.id,
      produitId: data.produitId,
      quantite: data.quantite,
      prixUnitaire: data.prixUnitaire,
      description: data.description,
      tauxTVA: data.tauxTva,
      ordreAffichage: data.ordreAffichage,
    });
    return mapLigne(entity);
  }

  @GrpcMethod('LigneFactureService', 'Get')
  async getLigne(data: GetLigneFactureRequest) {
    const entity = await this.ligneService.findById(data.id);
    return mapLigne(entity);
  }

  @GrpcMethod('LigneFactureService', 'List')
  async listLignes(data: ListLignesFactureRequest) {
    const result = await this.ligneService.findByFacture(data.factureId, {
      page: data.pagination?.page,
      limit: data.pagination?.limit,
    });
    return {
      lignes: result.lignes.map(mapLigne),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('LigneFactureService', 'Delete')
  async deleteLigne(data: DeleteLigneFactureRequest) {
    const success = await this.ligneService.delete(data.id);
    return { success };
  }

  // ===== FACTURE =====

  @GrpcMethod('FactureService', 'Create')
  async createFacture(data: CreateFactureRequest) {
    const entity = await this.factureService.create({
      organisationId: data.organisationId,
      dateEmission: data.dateEmission ? new Date(data.dateEmission) : new Date(),
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
    return mapFacture(entity);
  }

  @GrpcMethod('FactureService', 'Update')
  async updateFacture(data: UpdateFactureRequest) {
    const entity = await this.factureService.update({
      id: data.id,
      dateEmission: data.dateEmission ? new Date(data.dateEmission) : undefined,
      statutId: data.statutId,
      emissionFactureId: data.emissionFactureId,
      adresseFacturationId: data.adresseFacturationId,
    });
    return mapFacture(entity);
  }

  @GrpcMethod('FactureService', 'Get')
  async getFacture(data: GetFactureRequest) {
    const entity = await this.factureService.findById(data.id);
    return mapFacture(entity);
  }

  @GrpcMethod('FactureService', 'GetByNumero')
  async getFactureByNumero(data: GetFactureByNumeroRequest) {
    const entity = await this.factureService.findByNumero(data.organisationId, data.numero);
    return mapFacture(entity);
  }

  @GrpcMethod('FactureService', 'List')
  async listFactures(data: ListFacturesRequest) {
    const result = await this.factureService.findAll({
      organisationId: data.organisationId,
      clientBaseId: data.clientBaseId,
      contratId: data.contratId,
      statutId: data.statutId,
      dateFrom: data.dateFrom ? new Date(data.dateFrom) : undefined,
      dateTo: data.dateTo ? new Date(data.dateTo) : undefined,
      pagination: {
        page: data.pagination?.page,
        limit: data.pagination?.limit,
        sortBy: data.pagination?.sortBy,
        sortOrder: data.pagination?.sortOrder,
      },
    });
    return {
      factures: result.factures.map(mapFacture),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('FactureService', 'Delete')
  async deleteFacture(data: DeleteFactureRequest) {
    const success = await this.factureService.delete(data.id);
    return { success };
  }

  @GrpcMethod('FactureService', 'Validate')
  async validateFacture(data: ValidateFactureRequest) {
    const result = await this.factureService.validate(data.id);
    return {
      valid: result.valid,
      errors: result.errors,
      facture: mapFacture(result.facture),
    };
  }

  @GrpcMethod('FactureService', 'Finalize')
  async finalizeFacture(data: FinalizeFactureRequest) {
    const facture = await this.factureService.findById(data.id);
    const numero = await this.generationService.generateNextNumero(
      facture.organisationId,
      facture.organisationId,
    );
    const entity = await this.factureService.finalize(data.id, numero);
    return mapFacture(entity);
  }

  // ===== FACTURE SETTINGS =====

  @GrpcMethod('FactureSettingsService', 'Create')
  async createSettings(data: CreateFactureSettingsRequest) {
    return this.settingsService.create({
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
      logoPosition: data.logoPosition as 'left' | 'center' | 'right',
    });
  }

  @GrpcMethod('FactureSettingsService', 'Update')
  async updateSettings(data: UpdateFactureSettingsRequest) {
    return this.settingsService.update({
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
      logoPosition: data.logoPosition as 'left' | 'center' | 'right',
    });
  }

  @GrpcMethod('FactureSettingsService', 'Get')
  async getSettings(data: GetFactureSettingsRequest) {
    return this.settingsService.findById(data.id);
  }

  @GrpcMethod('FactureSettingsService', 'GetBySociete')
  async getSettingsBySociete(data: GetFactureSettingsBySocieteRequest) {
    return this.settingsService.findBySociete(data.societeId);
  }

  @GrpcMethod('FactureSettingsService', 'Delete')
  async deleteSettings(data: DeleteFactureSettingsRequest) {
    const success = await this.settingsService.delete(data.id);
    return { success };
  }

  @GrpcMethod('FactureSettingsService', 'UploadLogo')
  async uploadLogo(data: UploadLogoRequest) {
    return this.settingsService.uploadLogo(
      data.settingsId,
      data.logoBase64,
      data.logoMimeType,
    );
  }

  // ===== GENERATION =====

  @GrpcMethod('FactureGenerationService', 'GenerateNextNumero')
  async generateNextNumero(data: GenerateNextNumeroRequest) {
    const numero = await this.generationService.generateNextNumero(
      data.organisationId,
      data.societeId,
    );
    return { numero };
  }

  @GrpcMethod('FactureGenerationService', 'CalculateTotals')
  async calculateTotals(data: CalculateTotalsRequest) {
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
