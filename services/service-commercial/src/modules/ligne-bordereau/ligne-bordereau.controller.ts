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
        organisationId: req.organisationId,
        bordereauId: req.bordereauId,
        commissionId: req.commissionId || null,
        repriseId: req.repriseId || null,
        typeLigne: grpcToTypeLigne(req.typeLigne),
        contratId: req.contratId,
        contratReference: req.contratReference,
        clientNom: req.clientNom || null,
        produitNom: req.produitNom || null,
        montantBrut: parseFloat(req.montantBrut),
        montantReprise: parseFloat(req.montantReprise),
        montantNet: parseFloat(req.montantNet),
        baseCalcul: req.baseCalcul || null,
        tauxApplique: req.tauxApplique ? parseFloat(req.tauxApplique) : null,
        baremeId: req.baremeId || null,
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
      const { lignes, total } = await this.service.findByBordereau(req.bordereauId);
      return { lignes: lignes as unknown as LigneBordereauListResponse['lignes'], total };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'UpdateLigneBordereau')
  async update(req: UpdateLigneBordereauRequest): Promise<LigneBordereauResponse> {
    try {
      const data: Record<string, unknown> = {};
      if (req.montantBrut) data.montantBrut = parseFloat(req.montantBrut);
      if (req.montantReprise) data.montantReprise = parseFloat(req.montantReprise);
      if (req.montantNet) data.montantNet = parseFloat(req.montantNet);
      if (req.selectionne !== undefined) data.selectionne = req.selectionne;
      if (req.motifDeselection !== undefined) data.motifDeselection = req.motifDeselection;
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
        req.validateurId,
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
