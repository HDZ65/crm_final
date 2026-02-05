import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { BordereauService } from './bordereau.service';
import { StatutBordereau } from './entities/bordereau-commission.entity';

import type {
  CreateBordereauRequest,
  GetByIdRequest,
  GetBordereauxRequest,
  ValidateBordereauRequest,
  BordereauResponse,
  BordereauListResponse,
  ExportBordereauResponse,
  DeleteResponse,
} from '@crm/proto/commission';

const grpcToStatutBordereau = (n: number): StatutBordereau =>
  [StatutBordereau.BROUILLON, StatutBordereau.BROUILLON, StatutBordereau.VALIDE, StatutBordereau.EXPORTE, StatutBordereau.ARCHIVE][n] || StatutBordereau.BROUILLON;

@Controller()
export class BordereauController {
  constructor(private readonly service: BordereauService) {}

  @GrpcMethod('CommissionService', 'CreateBordereau')
  async create(req: CreateBordereauRequest): Promise<BordereauResponse> {
    try {
      const bordereau = await this.service.create({
        organisationId: req.organisation_id,
        reference: req.reference,
        periode: req.periode,
        apporteurId: req.apporteur_id,
        commentaire: req.commentaire,
        creePar: req.cree_par,
      });
      return { bordereau: bordereau as unknown as BordereauResponse['bordereau'] };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'GetBordereau')
  async get(req: GetByIdRequest): Promise<BordereauResponse> {
    try {
      const bordereau = await this.service.findById(req.id);
      return { bordereau: bordereau as unknown as BordereauResponse['bordereau'] };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'GetBordereaux')
  async list(req: GetBordereauxRequest): Promise<BordereauListResponse> {
    try {
      const { bordereaux, total } = await this.service.findByOrganisation(req.organisation_id, {
        apporteurId: req.apporteur_id,
        periode: req.periode,
        statut: req.statut ? grpcToStatutBordereau(req.statut) : undefined,
        limit: req.limit,
        offset: req.offset,
      });
      return { bordereaux: bordereaux as unknown as BordereauListResponse['bordereaux'], total };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'ValidateBordereau')
  async validate(req: ValidateBordereauRequest): Promise<BordereauResponse> {
    try {
      const bordereau = await this.service.validate(req.id, req.validateur_id);
      return { bordereau: bordereau as unknown as BordereauResponse['bordereau'] };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'ExportBordereau')
  async export(req: GetByIdRequest): Promise<ExportBordereauResponse> {
    try {
      const bordereau = await this.service.export(req.id);
      return { 
        success: true, 
        pdf_url: bordereau.fichierPdfUrl || '', 
        excel_url: bordereau.fichierExcelUrl || '',
      };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'DeleteBordereau')
  async delete(req: GetByIdRequest): Promise<DeleteResponse> {
    try {
      await this.service.delete(req.id);
      return { success: true, message: 'Bordereau supprime' };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }
}
