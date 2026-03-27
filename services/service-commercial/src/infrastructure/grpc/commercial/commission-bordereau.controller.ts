import { Controller } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import {
  CommissionBordereauServiceControllerMethods,
} from '@proto/commission/bordereau';
import type {
  CreateBordereauRequest,
  GetByIdRequest,
  GetBordereauxRequest,
  GetBordereauByApporteurPeriodeRequest,
  UpdateBordereauRequest,
  ValidateBordereauRequest,
  ExportBordereauRequest,
  CreateLigneBordereauRequest,
  UpdateLigneBordereauRequest,
  ValidateLigneRequest,
  GetByBordereauRequest,
} from '@proto/commission';
import { BordereauService } from '../../persistence/typeorm/repositories/commercial/bordereau.service';
import { LigneBordereauService } from '../../persistence/typeorm/repositories/commercial/ligne-bordereau.service';
import { BordereauExportService } from '../../../domain/commercial/services/bordereau-export.service';
import { BordereauFileStorageService } from '../../../domain/commercial/services/bordereau-file-storage.service';
import { StatutBordereau } from '../../../domain/commercial/entities/bordereau-commission.entity';

/** Convert proto limit/offset to pagination object expected by services */
function toPagination(data: { limit?: number; offset?: number }) {
  return {
    page: data.offset && data.limit ? Math.floor(data.offset / data.limit) + 1 : 1,
    limit: data.limit || 20,
  };
}

@Controller()
@CommissionBordereauServiceControllerMethods()
export class CommissionBordereauController {
  constructor(
    private readonly bordereauService: BordereauService,
    private readonly ligneBordereauService: LigneBordereauService,
    private readonly bordereauExportService: BordereauExportService,
    private readonly bordereauFileStorageService: BordereauFileStorageService,
  ) {}

  // ============================================================================
  // BORDEREAU CRUD (9 RPCs)
  // ============================================================================

  async createBordereau(data: CreateBordereauRequest) {
    return { bordereau: await this.bordereauService.create({
      organisationId: data.organisation_id,
      reference: data.reference,
      periode: data.periode,
      apporteurId: data.apporteur_id,
      commentaire: data.commentaire || null,
      creePar: data.cree_par || null,
    }) };
  }

  async getBordereau(data: GetByIdRequest) {
    return { bordereau: await this.bordereauService.findById(data.id) };
  }

  async getBordereaux(data: GetBordereauxRequest) {
    const result = await this.bordereauService.findAll(
      {
        organisationId: data.organisation_id,
        apporteurId: data.apporteur_id,
        periode: data.periode,
        statutBordereau: data.statut as any,
      },
      toPagination(data),
    );
    return {
      bordereaux: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  async getBordereauByApporteurPeriode(data: GetBordereauByApporteurPeriodeRequest) {
    return {
      bordereau: await this.bordereauService.findByApporteurPeriode(
        data.organisation_id,
        data.apporteur_id,
        data.periode,
      ),
    };
  }

  async updateBordereau(data: UpdateBordereauRequest) {
    const updateData: Record<string, unknown> = {};
    if (data.statut_bordereau) updateData.statutBordereau = data.statut_bordereau;
    if (data.commentaire !== undefined) updateData.commentaire = data.commentaire || null;

    return { bordereau: await this.bordereauService.update(data.id, updateData) };
  }

  async validateBordereau(data: ValidateBordereauRequest) {
    return {
      bordereau: await this.bordereauService.validate(data.id, data.validateur_id),
    };
  }

  async exportBordereau(data: GetByIdRequest) {
    const bordereau = await this.bordereauService.findById(data.id);
    // Mark as exported
    await this.bordereauService.update(data.id, {
      statutBordereau: 'exporte' as any,
      dateExport: new Date(),
    } as any);
    return {
      bordereau_id: bordereau.id,
      format: 'pdf',
      url: bordereau.fichierPdfUrl || '',
    };
  }

  async exportBordereauFiles(data: ExportBordereauRequest) {
    const bordereau = await this.bordereauService.findById(data.bordereau_id);
    if (bordereau.organisationId !== data.organisation_id) {
      throw new RpcException({
        code: status.PERMISSION_DENIED,
        message: 'Bordereau non accessible pour cette organisation',
      });
    }

    try {
      const lignes = await this.ligneBordereauService.findByBordereau(data.bordereau_id);
      const pdfBuffer = await this.bordereauExportService.genererPDF(bordereau, lignes);
      const excelBuffer = await this.bordereauExportService.genererExcel(bordereau, lignes);
      const hashSha256 = this.bordereauExportService.calculerHashSHA256(pdfBuffer);

      const [annee] = String(bordereau.periode || '').split('-');
      const storage = await this.bordereauFileStorageService.sauvegarderExports({
        societe: data.organisation_id,
        annee: annee || 'na',
        referenceBordereau: bordereau.reference,
        pdfBuffer,
        excelBuffer,
      });

      await this.bordereauService.update(data.bordereau_id, {
        statutBordereau: StatutBordereau.EXPORTE,
        dateExport: new Date(),
        fichierPdfUrl: storage.pdfUrl,
        fichierExcelUrl: storage.excelUrl,
        hashSha256,
      });

      return {
        success: true,
        pdf_url: storage.pdfUrl,
        excel_url: storage.excelUrl,
        hash_sha256: hashSha256,
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Echec export bordereau',
      });
    }
  }

  async deleteBordereau(data: GetByIdRequest) {
    const success = await this.bordereauService.delete(data.id);
    return { success };
  }

  // ============================================================================
  // LIGNE BORDEREAU CRUD (6 RPCs)
  // ============================================================================

  async createLigneBordereau(data: CreateLigneBordereauRequest) {
    return { ligne: await this.ligneBordereauService.create({
      organisationId: data.organisation_id,
      bordereauId: data.bordereau_id,
      commissionId: data.commission_id || null,
      repriseId: data.reprise_id || null,
      typeLigne: data.type_ligne as any,
      contratId: data.contrat_id,
      contratReference: data.contrat_reference,
      clientNom: data.client_nom || null,
      produitNom: data.produit_nom || null,
      montantBrut: Number(data.montant_brut),
      montantReprise: Number(data.montant_reprise) || 0,
      montantNet: Number(data.montant_net),
      baseCalcul: data.base_calcul || null,
      tauxApplique: data.taux_applique ? Number(data.taux_applique) : null,
      baremeId: data.bareme_id || null,
      ordre: data.ordre || 0,
    }) };
  }

  async getLigneBordereau(data: GetByIdRequest) {
    return { ligne: await this.ligneBordereauService.findById(data.id) };
  }

  async getLignesByBordereau(data: GetByBordereauRequest) {
    const lignes = await this.ligneBordereauService.findByBordereau(data.bordereau_id);
    return { lignes };
  }

  async updateLigneBordereau(data: UpdateLigneBordereauRequest) {
    const updateData: Record<string, unknown> = {};
    if (data.montant_brut !== undefined) updateData.montantBrut = Number(data.montant_brut);
    if (data.montant_reprise !== undefined) updateData.montantReprise = Number(data.montant_reprise);
    if (data.montant_net !== undefined) updateData.montantNet = Number(data.montant_net);
    if (data.selectionne !== undefined) updateData.selectionne = data.selectionne;
    if (data.motif_deselection !== undefined) updateData.motifDeselection = data.motif_deselection || null;

    return { ligne: await this.ligneBordereauService.update(data.id, updateData) };
  }

  async validateLigne(data: ValidateLigneRequest) {
    return {
      ligne: await this.ligneBordereauService.validate(data.id, data.validateur_id),
    };
  }

  async deleteLigneBordereau(data: GetByIdRequest) {
    const success = await this.ligneBordereauService.delete(data.id);
    return { success };
  }
}
