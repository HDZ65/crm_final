import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { BaremeService } from './bareme.service';
import { TypeCalcul, BaseCalcul } from './entities/bareme-commission.entity';

import type {
  CreateBaremeRequest,
  GetByIdRequest,
  GetBaremesRequest,
  GetBaremeApplicableRequest,
  UpdateBaremeRequest,
  BaremeResponse,
  BaremeListResponse,
  DeleteResponse,
} from '@crm/proto/commission';

// Enum converters
const grpcToTypeCalcul = (n: number): TypeCalcul => 
  [TypeCalcul.FIXE, TypeCalcul.FIXE, TypeCalcul.POURCENTAGE, TypeCalcul.PALIER, TypeCalcul.MIXTE][n] || TypeCalcul.FIXE;
const grpcToBaseCalcul = (n: number): BaseCalcul => 
  [BaseCalcul.COTISATION_HT, BaseCalcul.COTISATION_HT, BaseCalcul.CA_HT, BaseCalcul.FORFAIT][n] || BaseCalcul.COTISATION_HT;

@Controller()
export class BaremeController {
  constructor(private readonly service: BaremeService) {}

  @GrpcMethod('CommissionService', 'CreateBareme')
  async create(req: CreateBaremeRequest): Promise<BaremeResponse> {
    try {
      const bareme = await this.service.create({
        organisationId: req.organisation_id,
        code: req.code,
        nom: req.nom,
        description: req.description || undefined,
        typeCalcul: grpcToTypeCalcul(req.type_calcul),
        baseCalcul: grpcToBaseCalcul(req.base_calcul),
        montantFixe: req.montant_fixe ? parseFloat(req.montant_fixe) : undefined,
        tauxPourcentage: req.taux_pourcentage ? parseFloat(req.taux_pourcentage) : undefined,
        recurrenceActive: req.recurrence_active || false,
        tauxRecurrence: req.taux_recurrence ? parseFloat(req.taux_recurrence) : undefined,
        dureeRecurrenceMois: req.duree_recurrence_mois || undefined,
        dureeReprisesMois: req.duree_reprises_mois || 3,
        tauxReprise: req.taux_reprise ? parseFloat(req.taux_reprise) : 100,
        typeProduit: req.type_produit || undefined,
        profilRemuneration: req.profil_remuneration || undefined,
        societeId: req.societe_id || undefined,
        canalVente: req.canal_vente || undefined,
        repartitionCommercial: parseFloat(req.repartition_commercial || '100'),
        repartitionManager: parseFloat(req.repartition_manager || '0'),
        repartitionAgence: parseFloat(req.repartition_agence || '0'),
        repartitionEntreprise: parseFloat(req.repartition_entreprise || '0'),
        dateEffet: new Date(req.date_effet),
        dateFin: req.date_fin ? new Date(req.date_fin) : undefined,
      });
      return { bareme: bareme as unknown as BaremeResponse['bareme'] };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'GetBareme')
  async get(req: GetByIdRequest): Promise<BaremeResponse> {
    try {
      const bareme = await this.service.findById(req.id);
      return { bareme: bareme as unknown as BaremeResponse['bareme'] };
    } catch (e: unknown) {
      const err = e as { status?: number; message?: string };
      const code = err.status === 404 ? status.NOT_FOUND : status.INTERNAL;
      throw new RpcException({ code, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'GetBaremes')
  async list(req: GetBaremesRequest): Promise<BaremeListResponse> {
    try {
      const { baremes, total } = await this.service.findByOrganisation(req.organisation_id, {
        actifOnly: req.actif_only,
        typeProduit: req.type_produit,
        limit: req.limit,
        offset: req.offset,
      });
      return { baremes: baremes as unknown as BaremeListResponse['baremes'], total };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'GetBaremeApplicable')
  async getApplicable(req: GetBaremeApplicableRequest): Promise<BaremeResponse> {
    try {
      const bareme = await this.service.findApplicable(req.organisation_id, {
        typeProduit: req.type_produit,
        profilRemuneration: req.profil_remuneration,
        societeId: req.societe_id,
        canalVente: req.canal_vente,
        date: req.date,
      });
      if (!bareme) {
        throw new RpcException({ code: status.NOT_FOUND, message: 'No applicable bareme found' });
      }
      return { bareme: bareme as unknown as BaremeResponse['bareme'] };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'UpdateBareme')
  async update(req: UpdateBaremeRequest): Promise<BaremeResponse> {
    try {
      const data: Record<string, unknown> = {};
      if (req.nom) data.nom = req.nom;
      if (req.description !== undefined) data.description = req.description;
      if (req.type_calcul) data.type_calcul = grpcToTypeCalcul(req.type_calcul);
      if (req.base_calcul) data.base_calcul = grpcToBaseCalcul(req.base_calcul);
      if (req.montant_fixe) data.montant_fixe = parseFloat(req.montant_fixe);
      if (req.taux_pourcentage) data.taux_pourcentage = parseFloat(req.taux_pourcentage);
      if (req.recurrence_active !== undefined) data.recurrence_active = req.recurrence_active;
      if (req.date_fin) data.date_fin = new Date(req.date_fin);
      if (req.actif !== undefined) data.actif = req.actif;

      const bareme = await this.service.update(req.id, data);
      return { bareme: bareme as unknown as BaremeResponse['bareme'] };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'DeleteBareme')
  async delete(req: GetByIdRequest): Promise<DeleteResponse> {
    try {
      await this.service.delete(req.id);
      return { success: true, message: 'Bareme supprime' };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }
}
