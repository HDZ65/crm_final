import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

import { CommissionService } from './modules/commission/commission.service';
import { BaremeService } from './modules/bareme/bareme.service';
import { PalierService } from './modules/palier/palier.service';
import { BordereauService } from './modules/bordereau/bordereau.service';
import { LigneBordereauService } from './modules/ligne-bordereau/ligne-bordereau.service';
import { RepriseService } from './modules/reprise/reprise.service';
import { StatutService } from './modules/statut/statut.service';
import { CommissionEngineService } from './modules/engine/commission-engine.service';

import { TypeCalcul, BaseCalcul } from './modules/bareme/entities/bareme-commission.entity';
import { TypePalier } from './modules/palier/entities/palier-commission.entity';
import { StatutBordereau } from './modules/bordereau/entities/bordereau-commission.entity';
import { TypeLigne, StatutLigne } from './modules/ligne-bordereau/entities/ligne-bordereau.entity';
import { TypeReprise, StatutReprise } from './modules/reprise/entities/reprise-commission.entity';

import type {
  Commission,
  CreateCommissionRequest,
  GetByIdRequest,
  GetCommissionsRequest,
  UpdateCommissionRequest,
  CommissionResponse,
  CommissionListResponse,
  DeleteResponse,
  Bareme,
  CreateBaremeRequest,
  GetBaremesRequest,
  GetBaremeApplicableRequest,
  UpdateBaremeRequest,
  BaremeResponse,
  BaremeListResponse,
  Palier,
  CreatePalierRequest,
  GetByBaremeRequest,
  UpdatePalierRequest,
  PalierResponse,
  PalierListResponse,
  Bordereau,
  CreateBordereauRequest,
  GetBordereauxRequest,
  ValidateBordereauRequest,
  ExportBordereauResponse,
  BordereauResponse,
  BordereauListResponse,
  LigneBordereau,
  GetByBordereauRequest,
  ValidateLigneRequest,
  LigneBordereauResponse,
  LigneBordereauListResponse,
  Reprise,
  CreateRepriseRequest,
  GetReprisesRequest,
  ApplyRepriseRequest,
  RepriseResponse,
  RepriseListResponse,
  StatutCommission,
  CreateStatutRequest,
  GetStatutsRequest,
  GetStatutByCodeRequest,
  StatutResponse,
  StatutListResponse,
  CalculerCommissionRequest,
  CalculerCommissionResponse,
  GenererBordereauRequest,
  GenererBordereauResponse,
  DeclencherRepriseRequest,
} from '@proto/commission/commission';

// Helper functions for enum conversion
const typeCalculToGrpc = (t: TypeCalcul): number => ({ fixe: 1, pourcentage: 2, palier: 3, mixte: 4 }[t] || 0);
const grpcToTypeCalcul = (n: number): TypeCalcul => ([null, TypeCalcul.FIXE, TypeCalcul.POURCENTAGE, TypeCalcul.PALIER, TypeCalcul.MIXTE][n] || TypeCalcul.FIXE);

const baseCalculToGrpc = (b: BaseCalcul): number => ({ cotisation_ht: 1, ca_ht: 2, forfait: 3 }[b] || 0);
const grpcToBaseCalcul = (n: number): BaseCalcul => ([null, BaseCalcul.COTISATION_HT, BaseCalcul.CA_HT, BaseCalcul.FORFAIT][n] || BaseCalcul.COTISATION_HT);

const typePalierToGrpc = (t: TypePalier): number => ({ volume: 1, ca: 2, prime_produit: 3 }[t] || 0);
const grpcToTypePalier = (n: number): TypePalier => ([null, TypePalier.VOLUME, TypePalier.CA, TypePalier.PRIME_PRODUIT][n] || TypePalier.VOLUME);

const statutBordereauToGrpc = (s: StatutBordereau): number => ({ brouillon: 1, valide: 2, exporte: 3, archive: 4 }[s] || 0);
const grpcToStatutBordereau = (n: number): StatutBordereau => ([null, StatutBordereau.BROUILLON, StatutBordereau.VALIDE, StatutBordereau.EXPORTE, StatutBordereau.ARCHIVE][n] || StatutBordereau.BROUILLON);

const typeLigneToGrpc = (t: TypeLigne): number => ({ commission: 1, reprise: 2, acompte: 3, prime: 4, regularisation: 5 }[t] || 0);
const statutLigneToGrpc = (s: StatutLigne): number => ({ selectionnee: 1, deselectionnee: 2, validee: 3, rejetee: 4 }[s] || 0);
const grpcToStatutLigne = (n: number): StatutLigne => ([null, StatutLigne.SELECTIONNEE, StatutLigne.DESELECTIONNEE, StatutLigne.VALIDEE, StatutLigne.REJETEE][n] || StatutLigne.SELECTIONNEE);

const typeRepriseToGrpc = (t: TypeReprise): number => ({ resiliation: 1, impaye: 2, annulation: 3, regularisation: 4 }[t] || 0);
const grpcToTypeReprise = (n: number): TypeReprise => ([null, TypeReprise.RESILIATION, TypeReprise.IMPAYE, TypeReprise.ANNULATION, TypeReprise.REGULARISATION][n] || TypeReprise.RESILIATION);

const statutRepriseToGrpc = (s: StatutReprise): number => ({ en_attente: 1, appliquee: 2, annulee: 3 }[s] || 0);
const grpcToStatutReprise = (n: number): StatutReprise => ([null, StatutReprise.EN_ATTENTE, StatutReprise.APPLIQUEE, StatutReprise.ANNULEE][n] || StatutReprise.EN_ATTENTE);

@Controller()
export class CommissionController {
  private readonly logger = new Logger(CommissionController.name);

  constructor(
    private readonly commissionService: CommissionService,
    private readonly baremeService: BaremeService,
    private readonly palierService: PalierService,
    private readonly bordereauService: BordereauService,
    private readonly ligneService: LigneBordereauService,
    private readonly repriseService: RepriseService,
    private readonly statutService: StatutService,
    private readonly engineService: CommissionEngineService,
  ) {}

  // ===== COMMISSION =====
  @GrpcMethod('CommissionService', 'CreateCommission')
  async createCommission(req: CreateCommissionRequest): Promise<CommissionResponse> {
    try {
      const commission = await this.commissionService.create({
        organisationId: req.organisationId,
        reference: req.reference,
        apporteurId: req.apporteurId,
        contratId: req.contratId,
        produitId: req.produitId || null,
        compagnie: req.compagnie,
        typeBase: req.typeBase,
        montantBrut: parseFloat(req.montantBrut),
        montantReprises: parseFloat(req.montantReprises || '0'),
        montantAcomptes: parseFloat(req.montantAcomptes || '0'),
        montantNetAPayer: parseFloat(req.montantNetAPayer),
        statutId: req.statutId,
        periode: req.periode,
        dateCreation: new Date(req.dateCreation),
      });
      return { commission: this.mapCommission(commission) };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'GetCommission')
  async getCommission(req: GetByIdRequest): Promise<CommissionResponse> {
    try {
      const commission = await this.commissionService.findById(req.id);
      return { commission: this.mapCommission(commission) };
    } catch (e) {
      throw new RpcException({ code: e.status === 404 ? status.NOT_FOUND : status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'GetCommissions')
  async getCommissions(req: GetCommissionsRequest): Promise<CommissionListResponse> {
    try {
      const result = await this.commissionService.findByOrganisation(req.organisationId, {
        apporteurId: req.apporteurId,
        periode: req.periode,
        statutId: req.statutId,
        limit: req.limit,
        offset: req.offset,
      });
      return { commissions: result.commissions.map(c => this.mapCommission(c)), total: result.total };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'UpdateCommission')
  async updateCommission(req: UpdateCommissionRequest): Promise<CommissionResponse> {
    try {
      const data: any = {};
      if (req.reference) data.reference = req.reference;
      if (req.compagnie) data.compagnie = req.compagnie;
      if (req.typeBase) data.typeBase = req.typeBase;
      if (req.montantBrut) data.montantBrut = parseFloat(req.montantBrut);
      if (req.montantReprises) data.montantReprises = parseFloat(req.montantReprises);
      if (req.montantAcomptes) data.montantAcomptes = parseFloat(req.montantAcomptes);
      if (req.montantNetAPayer) data.montantNetAPayer = parseFloat(req.montantNetAPayer);
      if (req.statutId) data.statutId = req.statutId;
      const commission = await this.commissionService.update(req.id, data);
      return { commission: this.mapCommission(commission) };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'DeleteCommission')
  async deleteCommission(req: GetByIdRequest): Promise<DeleteResponse> {
    try {
      await this.commissionService.delete(req.id);
      return { success: true, message: 'Commission deleted' };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  // ===== BAREME =====
  @GrpcMethod('CommissionService', 'CreateBareme')
  async createBareme(req: CreateBaremeRequest): Promise<BaremeResponse> {
    try {
      const bareme = await this.baremeService.create({
        organisationId: req.organisationId,
        code: req.code,
        nom: req.nom,
        description: req.description || null,
        typeCalcul: grpcToTypeCalcul(req.typeCalcul),
        baseCalcul: grpcToBaseCalcul(req.baseCalcul),
        montantFixe: req.montantFixe ? parseFloat(req.montantFixe) : null,
        tauxPourcentage: req.tauxPourcentage ? parseFloat(req.tauxPourcentage) : null,
        recurrenceActive: req.recurrenceActive || false,
        tauxRecurrence: req.tauxRecurrence ? parseFloat(req.tauxRecurrence) : null,
        dureeRecurrenceMois: req.dureeRecurrenceMois || null,
        dureeReprisesMois: req.dureeReprisesMois || 3,
        tauxReprise: req.tauxReprise ? parseFloat(req.tauxReprise) : 100,
        typeProduit: req.typeProduit || null,
        profilRemuneration: req.profilRemuneration || null,
        societeId: req.societeId || null,
        canalVente: req.canalVente || null,
        repartitionCommercial: parseFloat(req.repartitionCommercial || '100'),
        repartitionManager: parseFloat(req.repartitionManager || '0'),
        repartitionAgence: parseFloat(req.repartitionAgence || '0'),
        repartitionEntreprise: parseFloat(req.repartitionEntreprise || '0'),
        dateEffet: new Date(req.dateEffet),
        dateFin: req.dateFin ? new Date(req.dateFin) : null,
      });
      return { bareme: this.mapBareme(bareme) };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'GetBareme')
  async getBareme(req: GetByIdRequest): Promise<BaremeResponse> {
    try {
      const bareme = await this.baremeService.findById(req.id);
      return { bareme: this.mapBareme(bareme) };
    } catch (e) {
      throw new RpcException({ code: e.status === 404 ? status.NOT_FOUND : status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'GetBaremes')
  async getBaremes(req: GetBaremesRequest): Promise<BaremeListResponse> {
    try {
      const result = await this.baremeService.findByOrganisation(req.organisationId, {
        actifOnly: req.actifOnly,
        typeProduit: req.typeProduit,
        limit: req.limit,
        offset: req.offset,
      });
      return { baremes: result.baremes.map(b => this.mapBareme(b)), total: result.total };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'GetBaremeApplicable')
  async getBaremeApplicable(req: GetBaremeApplicableRequest): Promise<BaremeResponse> {
    try {
      const bareme = await this.baremeService.findApplicable(req.organisationId, {
        typeProduit: req.typeProduit,
        profilRemuneration: req.profilRemuneration,
        societeId: req.societeId,
        canalVente: req.canalVente,
        date: req.date,
      });
      if (!bareme) throw new RpcException({ code: status.NOT_FOUND, message: 'No applicable bareme' });
      return { bareme: this.mapBareme(bareme) };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'UpdateBareme')
  async updateBareme(req: UpdateBaremeRequest): Promise<BaremeResponse> {
    try {
      const data: any = {};
      if (req.nom) data.nom = req.nom;
      if (req.description !== undefined) data.description = req.description;
      if (req.typeCalcul) data.typeCalcul = grpcToTypeCalcul(req.typeCalcul);
      if (req.baseCalcul) data.baseCalcul = grpcToBaseCalcul(req.baseCalcul);
      if (req.montantFixe) data.montantFixe = parseFloat(req.montantFixe);
      if (req.tauxPourcentage) data.tauxPourcentage = parseFloat(req.tauxPourcentage);
      if (req.recurrenceActive !== undefined) data.recurrenceActive = req.recurrenceActive;
      if (req.dateFin) data.dateFin = new Date(req.dateFin);
      if (req.actif !== undefined) data.actif = req.actif;
      const bareme = await this.baremeService.update(req.id, data);
      return { bareme: this.mapBareme(bareme) };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'DeleteBareme')
  async deleteBareme(req: GetByIdRequest): Promise<DeleteResponse> {
    try {
      await this.baremeService.delete(req.id);
      return { success: true, message: 'Bareme deleted' };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  // ===== PALIER =====
  @GrpcMethod('CommissionService', 'CreatePalier')
  async createPalier(req: CreatePalierRequest): Promise<PalierResponse> {
    try {
      const palier = await this.palierService.create({
        organisationId: req.organisationId,
        baremeId: req.baremeId,
        code: req.code,
        nom: req.nom,
        description: req.description || null,
        typePalier: grpcToTypePalier(req.typePalier),
        seuilMin: parseFloat(req.seuilMin),
        seuilMax: req.seuilMax ? parseFloat(req.seuilMax) : null,
        montantPrime: parseFloat(req.montantPrime),
        tauxBonus: req.tauxBonus ? parseFloat(req.tauxBonus) : null,
        cumulable: req.cumulable || false,
        parPeriode: req.parPeriode !== false,
        typeProduit: req.typeProduit || null,
        ordre: req.ordre || 0,
      });
      return { palier: this.mapPalier(palier) };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'GetPalier')
  async getPalier(req: GetByIdRequest): Promise<PalierResponse> {
    try {
      const palier = await this.palierService.findById(req.id);
      return { palier: this.mapPalier(palier) };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'GetPaliersByBareme')
  async getPaliersByBareme(req: GetByBaremeRequest): Promise<PalierListResponse> {
    try {
      const result = await this.palierService.findByBareme(req.baremeId);
      return { paliers: result.paliers.map(p => this.mapPalier(p)), total: result.total };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'UpdatePalier')
  async updatePalier(req: UpdatePalierRequest): Promise<PalierResponse> {
    try {
      const data: any = {};
      if (req.nom) data.nom = req.nom;
      if (req.description !== undefined) data.description = req.description;
      if (req.seuilMin) data.seuilMin = parseFloat(req.seuilMin);
      if (req.seuilMax) data.seuilMax = parseFloat(req.seuilMax);
      if (req.montantPrime) data.montantPrime = parseFloat(req.montantPrime);
      if (req.tauxBonus) data.tauxBonus = parseFloat(req.tauxBonus);
      if (req.cumulable !== undefined) data.cumulable = req.cumulable;
      if (req.parPeriode !== undefined) data.parPeriode = req.parPeriode;
      if (req.ordre !== undefined) data.ordre = req.ordre;
      if (req.actif !== undefined) data.actif = req.actif;
      const palier = await this.palierService.update(req.id, data);
      return { palier: this.mapPalier(palier) };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'DeletePalier')
  async deletePalier(req: GetByIdRequest): Promise<DeleteResponse> {
    try {
      await this.palierService.delete(req.id);
      return { success: true, message: 'Palier deleted' };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  // ===== BORDEREAU =====
  @GrpcMethod('CommissionService', 'CreateBordereau')
  async createBordereau(req: CreateBordereauRequest): Promise<BordereauResponse> {
    try {
      const bordereau = await this.bordereauService.create({
        organisationId: req.organisationId,
        reference: req.reference,
        periode: req.periode,
        apporteurId: req.apporteurId,
        commentaire: req.commentaire,
        creePar: req.creePar,
      });
      return { bordereau: this.mapBordereau(bordereau) };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'GetBordereau')
  async getBordereau(req: GetByIdRequest): Promise<BordereauResponse> {
    try {
      const bordereau = await this.bordereauService.findById(req.id);
      return { bordereau: this.mapBordereau(bordereau) };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'GetBordereaux')
  async getBordereaux(req: GetBordereauxRequest): Promise<BordereauListResponse> {
    try {
      const result = await this.bordereauService.findByOrganisation(req.organisationId, {
        apporteurId: req.apporteurId,
        periode: req.periode,
        statut: req.statut ? grpcToStatutBordereau(req.statut) : undefined,
        limit: req.limit,
        offset: req.offset,
      });
      return { bordereaux: result.bordereaux.map(b => this.mapBordereau(b)), total: result.total };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'ValidateBordereau')
  async validateBordereau(req: ValidateBordereauRequest): Promise<BordereauResponse> {
    try {
      const bordereau = await this.bordereauService.validate(req.id, req.validateurId);
      return { bordereau: this.mapBordereau(bordereau) };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'ExportBordereau')
  async exportBordereau(req: GetByIdRequest): Promise<ExportBordereauResponse> {
    try {
      const bordereau = await this.bordereauService.export(req.id);
      return { success: true, pdfUrl: bordereau.fichierPdfUrl || '', excelUrl: bordereau.fichierExcelUrl || '' };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'DeleteBordereau')
  async deleteBordereau(req: GetByIdRequest): Promise<DeleteResponse> {
    try {
      await this.bordereauService.delete(req.id);
      return { success: true, message: 'Bordereau deleted' };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  // ===== LIGNE BORDEREAU =====
  @GrpcMethod('CommissionService', 'GetLignesByBordereau')
  async getLignesByBordereau(req: GetByBordereauRequest): Promise<LigneBordereauListResponse> {
    try {
      const result = await this.ligneService.findByBordereau(req.bordereauId);
      return { lignes: result.lignes.map(l => this.mapLigne(l)), total: result.total };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'ValidateLigne')
  async validateLigne(req: ValidateLigneRequest): Promise<LigneBordereauResponse> {
    try {
      const ligne = await this.ligneService.validate(req.id, req.validateurId, grpcToStatutLigne(req.statut), req.motif);
      return { ligne: this.mapLigne(ligne) };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  // ===== REPRISE =====
  @GrpcMethod('CommissionService', 'CreateReprise')
  async createReprise(req: CreateRepriseRequest): Promise<RepriseResponse> {
    try {
      const reprise = await this.repriseService.create({
        organisationId: req.organisationId,
        commissionOriginaleId: req.commissionOriginaleId,
        contratId: req.contratId,
        apporteurId: req.apporteurId,
        reference: req.reference,
        typeReprise: grpcToTypeReprise(req.typeReprise),
        montantReprise: parseFloat(req.montantReprise),
        tauxReprise: parseFloat(req.tauxReprise || '100'),
        montantOriginal: parseFloat(req.montantOriginal),
        periodeOrigine: req.periodeOrigine,
        periodeApplication: req.periodeApplication,
        dateEvenement: new Date(req.dateEvenement),
        dateLimite: new Date(req.dateLimite),
        motif: req.motif,
        commentaire: req.commentaire,
      });
      return { reprise: this.mapReprise(reprise) };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'GetReprise')
  async getReprise(req: GetByIdRequest): Promise<RepriseResponse> {
    try {
      const reprise = await this.repriseService.findById(req.id);
      return { reprise: this.mapReprise(reprise) };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'GetReprises')
  async getReprises(req: GetReprisesRequest): Promise<RepriseListResponse> {
    try {
      const result = await this.repriseService.findByOrganisation(req.organisationId, {
        apporteurId: req.apporteurId,
        statut: req.statut ? grpcToStatutReprise(req.statut) : undefined,
        limit: req.limit,
        offset: req.offset,
      });
      return { reprises: result.reprises.map(r => this.mapReprise(r)), total: result.total };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'ApplyReprise')
  async applyReprise(req: ApplyRepriseRequest): Promise<RepriseResponse> {
    try {
      const reprise = await this.repriseService.apply(req.id, req.bordereauId);
      return { reprise: this.mapReprise(reprise) };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'CancelReprise')
  async cancelReprise(req: GetByIdRequest): Promise<RepriseResponse> {
    try {
      const reprise = await this.repriseService.cancel(req.id);
      return { reprise: this.mapReprise(reprise) };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  // ===== STATUT =====
  @GrpcMethod('CommissionService', 'CreateStatut')
  async createStatut(req: CreateStatutRequest): Promise<StatutResponse> {
    try {
      const statut = await this.statutService.create({
        code: req.code,
        nom: req.nom,
        description: req.description,
        ordreAffichage: req.ordreAffichage || 0,
      });
      return { statut: this.mapStatut(statut) };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'GetStatuts')
  async getStatuts(req: GetStatutsRequest): Promise<StatutListResponse> {
    try {
      const result = await this.statutService.findAll(req.limit, req.offset);
      return { statuts: result.statuts.map(s => this.mapStatut(s)), total: result.total };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'GetStatutByCode')
  async getStatutByCode(req: GetStatutByCodeRequest): Promise<StatutResponse> {
    try {
      const statut = await this.statutService.findByCode(req.code);
      return { statut: this.mapStatut(statut) };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  // ===== ENGINE =====
  @GrpcMethod('CommissionService', 'CalculerCommission')
  async calculerCommission(req: CalculerCommissionRequest): Promise<CalculerCommissionResponse> {
    try {
      const result = await this.engineService.calculerCommission({
        organisationId: req.organisationId,
        apporteurId: req.apporteurId,
        contratId: req.contratId,
        produitId: req.produitId,
        typeProduit: req.typeProduit,
        profilRemuneration: req.profilRemuneration,
        societeId: req.societeId,
        canalVente: req.canalVente,
        montantBase: parseFloat(req.montantBase),
        periode: req.periode,
      });
      return {
        commission: this.mapCommission(result.commission),
        baremeApplique: this.mapBareme(result.baremeApplique),
        primes: result.primes.map(p => ({
          palierId: p.palierId,
          palierNom: p.palierNom,
          montant: String(p.montant),
          type: p.type,
        })),
        montantTotal: String(result.montantTotal),
      };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'GenererBordereau')
  async genererBordereau(req: GenererBordereauRequest): Promise<GenererBordereauResponse> {
    try {
      const result = await this.engineService.genererBordereau(
        req.organisationId,
        req.apporteurId,
        req.periode,
        req.creePar,
      );
      return {
        bordereau: this.mapBordereau(result.bordereau),
        summary: {
          nombreCommissions: result.summary.nombreCommissions,
          nombreReprises: result.summary.nombreReprises,
          nombrePrimes: result.summary.nombrePrimes,
          totalBrut: String(result.summary.totalBrut),
          totalReprises: String(result.summary.totalReprises),
          totalNet: String(result.summary.totalNet),
        },
      };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('CommissionService', 'DeclencherReprise')
  async declencherReprise(req: DeclencherRepriseRequest): Promise<RepriseResponse> {
    try {
      const reprise = await this.engineService.declencherReprise(
        req.commissionId,
        grpcToTypeReprise(req.typeReprise),
        new Date(req.dateEvenement),
        req.motif,
      );
      return { reprise: this.mapReprise(reprise) };
    } catch (e) {
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  // ===== MAPPERS =====
  private mapCommission(c: any): Commission {
    return {
      id: c.id,
      organisationId: c.organisationId,
      reference: c.reference,
      apporteurId: c.apporteurId,
      contratId: c.contratId,
      produitId: c.produitId,
      compagnie: c.compagnie,
      typeBase: c.typeBase,
      montantBrut: String(c.montantBrut),
      montantReprises: String(c.montantReprises),
      montantAcomptes: String(c.montantAcomptes),
      montantNetAPayer: String(c.montantNetAPayer),
      statutId: c.statutId,
      periode: c.periode,
      dateCreation: c.dateCreation?.toISOString?.() || c.dateCreation,
      createdAt: c.createdAt?.toISOString?.() || c.createdAt,
      updatedAt: c.updatedAt?.toISOString?.() || c.updatedAt,
    };
  }

  private mapBareme(b: any): Bareme {
    return {
      id: b.id,
      organisationId: b.organisationId,
      code: b.code,
      nom: b.nom,
      description: b.description,
      typeCalcul: typeCalculToGrpc(b.typeCalcul),
      baseCalcul: baseCalculToGrpc(b.baseCalcul),
      montantFixe: b.montantFixe ? String(b.montantFixe) : undefined,
      tauxPourcentage: b.tauxPourcentage ? String(b.tauxPourcentage) : undefined,
      recurrenceActive: b.recurrenceActive,
      tauxRecurrence: b.tauxRecurrence ? String(b.tauxRecurrence) : undefined,
      dureeRecurrenceMois: b.dureeRecurrenceMois,
      dureeReprisesMois: b.dureeReprisesMois,
      tauxReprise: String(b.tauxReprise),
      typeProduit: b.typeProduit,
      profilRemuneration: b.profilRemuneration,
      societeId: b.societeId,
      canalVente: b.canalVente,
      repartitionCommercial: String(b.repartitionCommercial),
      repartitionManager: String(b.repartitionManager),
      repartitionAgence: String(b.repartitionAgence),
      repartitionEntreprise: String(b.repartitionEntreprise),
      version: b.version,
      dateEffet: b.dateEffet?.toISOString?.() || b.dateEffet,
      dateFin: b.dateFin?.toISOString?.() || b.dateFin,
      actif: b.actif,
      createdAt: b.createdAt?.toISOString?.() || b.createdAt,
      updatedAt: b.updatedAt?.toISOString?.() || b.updatedAt,
      paliers: b.paliers?.map((p: any) => this.mapPalier(p)) || [],
    };
  }

  private mapPalier(p: any): Palier {
    return {
      id: p.id,
      organisationId: p.organisationId,
      baremeId: p.baremeId,
      code: p.code,
      nom: p.nom,
      description: p.description,
      typePalier: typePalierToGrpc(p.typePalier),
      seuilMin: String(p.seuilMin),
      seuilMax: p.seuilMax ? String(p.seuilMax) : undefined,
      montantPrime: String(p.montantPrime),
      tauxBonus: p.tauxBonus ? String(p.tauxBonus) : undefined,
      cumulable: p.cumulable,
      parPeriode: p.parPeriode,
      typeProduit: p.typeProduit,
      ordre: p.ordre,
      actif: p.actif,
      createdAt: p.createdAt?.toISOString?.() || p.createdAt,
      updatedAt: p.updatedAt?.toISOString?.() || p.updatedAt,
    };
  }

  private mapBordereau(b: any): Bordereau {
    return {
      id: b.id,
      organisationId: b.organisationId,
      reference: b.reference,
      periode: b.periode,
      apporteurId: b.apporteurId,
      totalBrut: String(b.totalBrut),
      totalReprises: String(b.totalReprises),
      totalAcomptes: String(b.totalAcomptes),
      totalNetAPayer: String(b.totalNetAPayer),
      nombreLignes: b.nombreLignes,
      statutBordereau: statutBordereauToGrpc(b.statutBordereau),
      dateValidation: b.dateValidation?.toISOString?.() || b.dateValidation,
      validateurId: b.validateurId,
      dateExport: b.dateExport?.toISOString?.() || b.dateExport,
      fichierPdfUrl: b.fichierPdfUrl,
      fichierExcelUrl: b.fichierExcelUrl,
      commentaire: b.commentaire,
      createdAt: b.createdAt?.toISOString?.() || b.createdAt,
      updatedAt: b.updatedAt?.toISOString?.() || b.updatedAt,
      lignes: b.lignes?.map((l: any) => this.mapLigne(l)) || [],
    };
  }

  private mapLigne(l: any): LigneBordereau {
    return {
      id: l.id,
      organisationId: l.organisationId,
      bordereauId: l.bordereauId,
      commissionId: l.commissionId,
      repriseId: l.repriseId,
      typeLigne: typeLigneToGrpc(l.typeLigne),
      contratId: l.contratId,
      contratReference: l.contratReference,
      clientNom: l.clientNom,
      produitNom: l.produitNom,
      montantBrut: String(l.montantBrut),
      montantReprise: String(l.montantReprise),
      montantNet: String(l.montantNet),
      baseCalcul: l.baseCalcul,
      tauxApplique: l.tauxApplique ? String(l.tauxApplique) : undefined,
      baremeId: l.baremeId,
      statutLigne: statutLigneToGrpc(l.statutLigne),
      selectionne: l.selectionne,
      motifDeselection: l.motifDeselection,
      validateurId: l.validateurId,
      dateValidation: l.dateValidation?.toISOString?.() || l.dateValidation,
      ordre: l.ordre,
      createdAt: l.createdAt?.toISOString?.() || l.createdAt,
      updatedAt: l.updatedAt?.toISOString?.() || l.updatedAt,
    };
  }

  private mapReprise(r: any): Reprise {
    return {
      id: r.id,
      organisationId: r.organisationId,
      commissionOriginaleId: r.commissionOriginaleId,
      contratId: r.contratId,
      apporteurId: r.apporteurId,
      reference: r.reference,
      typeReprise: typeRepriseToGrpc(r.typeReprise),
      montantReprise: String(r.montantReprise),
      tauxReprise: String(r.tauxReprise),
      montantOriginal: String(r.montantOriginal),
      periodeOrigine: r.periodeOrigine,
      periodeApplication: r.periodeApplication,
      dateEvenement: r.dateEvenement?.toISOString?.() || r.dateEvenement,
      dateLimite: r.dateLimite?.toISOString?.() || r.dateLimite,
      dateApplication: r.dateApplication?.toISOString?.() || r.dateApplication,
      statutReprise: statutRepriseToGrpc(r.statutReprise),
      bordereauId: r.bordereauId,
      motif: r.motif,
      commentaire: r.commentaire,
      createdAt: r.createdAt?.toISOString?.() || r.createdAt,
      updatedAt: r.updatedAt?.toISOString?.() || r.updatedAt,
    };
  }

  private mapStatut(s: any): StatutCommission {
    return {
      id: s.id,
      code: s.code,
      nom: s.nom,
      description: s.description,
      ordreAffichage: s.ordreAffichage,
    };
  }
}
