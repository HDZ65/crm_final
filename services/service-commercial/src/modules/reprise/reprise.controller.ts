import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { RepriseService } from './reprise.service';
import { TypeReprise, StatutReprise } from './entities/reprise-commission.entity';

import type {
  CreateRepriseRequest,
  GetByIdRequest,
  GetReprisesRequest,
  GetByCommissionRequest,
  ApplyRepriseRequest,
  RepriseResponse,
  RepriseListResponse,
  DeleteResponse,
} from '@crm/proto/commission';

const grpcToTypeReprise = (n: number): TypeReprise =>
  [TypeReprise.RESILIATION, TypeReprise.RESILIATION, TypeReprise.IMPAYE, TypeReprise.ANNULATION, TypeReprise.REGULARISATION][n] || TypeReprise.RESILIATION;

const grpcToStatutReprise = (n: number): StatutReprise =>
  [StatutReprise.EN_ATTENTE, StatutReprise.EN_ATTENTE, StatutReprise.APPLIQUEE, StatutReprise.ANNULEE][n] || StatutReprise.EN_ATTENTE;

@Controller()
export class RepriseController {
  constructor(private readonly service: RepriseService) {}

  @GrpcMethod('CommissionService', 'CreateReprise')
  async create(req: CreateRepriseRequest): Promise<RepriseResponse> {
    try {
      const reprise = await this.service.create({
        organisationId: req.organisationId,
        commissionOriginaleId: req.commissionOriginaleId,
        contratId: req.contratId,
        apporteurId: req.apporteurId,
        reference: req.reference,
        typeReprise: grpcToTypeReprise(req.typeReprise),
        montantReprise: parseFloat(req.montantReprise),
        tauxReprise: parseFloat(req.tauxReprise),
        montantOriginal: parseFloat(req.montantOriginal),
        periodeOrigine: req.periodeOrigine,
        periodeApplication: req.periodeApplication,
        dateEvenement: new Date(req.dateEvenement),
        dateLimite: new Date(req.dateLimite),
        motif: req.motif || null,
        commentaire: req.commentaire || null,
      });
      return { reprise: reprise as unknown as RepriseResponse['reprise'] };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'GetReprise')
  async get(req: GetByIdRequest): Promise<RepriseResponse> {
    try {
      const reprise = await this.service.findById(req.id);
      return { reprise: reprise as unknown as RepriseResponse['reprise'] };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'GetReprises')
  async list(req: GetReprisesRequest): Promise<RepriseListResponse> {
    try {
      const { reprises, total } = await this.service.findByOrganisation(req.organisationId, {
        apporteurId: req.apporteurId,
        statut: req.statut ? grpcToStatutReprise(req.statut) : undefined,
        limit: req.limit,
        offset: req.offset,
      });
      return { reprises: reprises as unknown as RepriseListResponse['reprises'], total };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'GetReprisesByCommission')
  async listByCommission(req: GetByCommissionRequest): Promise<RepriseListResponse> {
    try {
      const { reprises, total } = await this.service.findByCommission(req.commissionId);
      return { reprises: reprises as unknown as RepriseListResponse['reprises'], total };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'ApplyReprise')
  async apply(req: ApplyRepriseRequest): Promise<RepriseResponse> {
    try {
      const reprise = await this.service.apply(req.id, req.bordereauId);
      return { reprise: reprise as unknown as RepriseResponse['reprise'] };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'CancelReprise')
  async cancel(req: GetByIdRequest): Promise<RepriseResponse> {
    try {
      const reprise = await this.service.cancel(req.id);
      return { reprise: reprise as unknown as RepriseResponse['reprise'] };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'DeleteReprise')
  async delete(req: GetByIdRequest): Promise<DeleteResponse> {
    try {
      await this.service.delete(req.id);
      return { success: true, message: 'Reprise supprimee' };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }
}
