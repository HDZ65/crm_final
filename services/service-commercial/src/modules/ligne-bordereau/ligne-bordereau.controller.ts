import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { LigneBordereauService } from './ligne-bordereau.service';
import { TypeLigne, StatutLigne } from './entities/ligne-bordereau.entity';

import type {
  CreateLigneBordereauRequest,
  GetByIdRequest,
  GetByBordereauRequest,
  UpdateLigneBordereauRequest,
  ValidateLigneRequest,
  LigneBordereauResponse,
  LigneBordereauListResponse,
  DeleteResponse,
} from '@crm/proto/commission';

const grpcToTypeLigne = (n: number): TypeLigne =>
  [TypeLigne.COMMISSION, TypeLigne.COMMISSION, TypeLigne.REPRISE, TypeLigne.ACOMPTE, TypeLigne.PRIME, TypeLigne.REGULARISATION][n] || TypeLigne.COMMISSION;

const grpcToStatutLigne = (n: number): StatutLigne =>
  [StatutLigne.SELECTIONNEE, StatutLigne.SELECTIONNEE, StatutLigne.DESELECTIONNEE, StatutLigne.VALIDEE, StatutLigne.REJETEE][n] || StatutLigne.SELECTIONNEE;

@Controller()
export class LigneBordereauController {
  constructor(private readonly service: LigneBordereauService) {}

  @GrpcMethod('CommissionService', 'CreateLigneBordereau')
  async create(req: CreateLigneBordereauRequest): Promise<LigneBordereauResponse> {
    try {
      const ligne = await this.service.create({
        organisationId: req.organisation_id,
        bordereauId: req.bordereau_id,
        commissionId: req.commission_id || null,
        repriseId: req.reprise_id || null,
        typeLigne: grpcToTypeLigne(req.type_ligne),
        contratId: req.contrat_id,
        contratReference: req.contrat_reference,
        clientNom: req.client_nom || null,
        produitNom: req.produit_nom || null,
        montantBrut: parseFloat(req.montant_brut),
        montantReprise: parseFloat(req.montant_reprise),
        montantNet: parseFloat(req.montant_net),
        baseCalcul: req.base_calcul || null,
        tauxApplique: req.taux_applique ? parseFloat(req.taux_applique) : null,
        baremeId: req.bareme_id || null,
        ordre: req.ordre || 0,
      });
      return { ligne: ligne as unknown as LigneBordereauResponse['ligne'] };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'GetLigneBordereau')
  async get(req: GetByIdRequest): Promise<LigneBordereauResponse> {
    try {
      const ligne = await this.service.findById(req.id);
      return { ligne: ligne as unknown as LigneBordereauResponse['ligne'] };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'GetLignesByBordereau')
  async listByBordereau(req: GetByBordereauRequest): Promise<LigneBordereauListResponse> {
    try {
      const { lignes, total } = await this.service.findByBordereau(req.bordereau_id);
      return { lignes: lignes as unknown as LigneBordereauListResponse['lignes'], total };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'UpdateLigneBordereau')
  async update(req: UpdateLigneBordereauRequest): Promise<LigneBordereauResponse> {
    try {
      const data: Record<string, unknown> = {};
      if (req.montant_brut) data.montant_brut = parseFloat(req.montant_brut);
      if (req.montant_reprise) data.montant_reprise = parseFloat(req.montant_reprise);
      if (req.montant_net) data.montant_net = parseFloat(req.montant_net);
      if (req.selectionne !== undefined) data.selectionne = req.selectionne;
      if (req.motif_deselection !== undefined) data.motifDeselection = req.motif_deselection;
      if (req.ordre !== undefined) data.ordre = req.ordre;

      const ligne = await this.service.update(req.id, data);
      return { ligne: ligne as unknown as LigneBordereauResponse['ligne'] };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'ValidateLigne')
  async validate(req: ValidateLigneRequest): Promise<LigneBordereauResponse> {
    try {
      const ligne = await this.service.validate(
        req.id,
        req.validateur_id,
        grpcToStatutLigne(req.statut),
        req.motif,
      );
      return { ligne: ligne as unknown as LigneBordereauResponse['ligne'] };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'DeleteLigneBordereau')
  async delete(req: GetByIdRequest): Promise<DeleteResponse> {
    try {
      await this.service.delete(req.id);
      return { success: true, message: 'Ligne supprimee' };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }
}
