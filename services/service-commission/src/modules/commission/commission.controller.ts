import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { CommissionService } from './commission.service';
import { CommissionEntity } from './entities/commission.entity';

import type {
  CreateCommissionRequest,
  GetByIdRequest,
  GetCommissionsRequest,
  UpdateCommissionRequest,
  CommissionResponse,
  CommissionListResponse,
  DeleteResponse,
} from '@crm/proto/commission';

@Controller()
export class CommissionController {
  constructor(private readonly service: CommissionService) {}

  @GrpcMethod('CommissionService', 'CreateCommission')
  async create(req: CreateCommissionRequest): Promise<CommissionResponse> {
    try {
      const commission = await this.service.create({
        organisationId: req.organisationId,
        reference: req.reference,
        apporteurId: req.apporteurId,
        contratId: req.contratId,
        produitId: req.produitId || undefined,
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
      return { commission: this.toProto(commission) };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'GetCommission')
  async get(req: GetByIdRequest): Promise<CommissionResponse> {
    try {
      const commission = await this.service.findById(req.id);
      return { commission: this.toProto(commission) };
    } catch (e: unknown) {
      const err = e as { status?: number; message?: string };
      const code = err.status === 404 ? status.NOT_FOUND : status.INTERNAL;
      throw new RpcException({ code, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'GetCommissions')
  async list(req: GetCommissionsRequest): Promise<CommissionListResponse> {
    try {
      const { commissions, total } = await this.service.findByOrganisation(req.organisationId, {
        apporteurId: req.apporteurId,
        periode: req.periode,
        statutId: req.statutId,
        limit: req.limit,
        offset: req.offset,
      });
      return { 
        commissions: commissions.map(c => this.toProto(c)), 
        total,
      };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'UpdateCommission')
  async update(req: UpdateCommissionRequest): Promise<CommissionResponse> {
    try {
      const data: Record<string, unknown> = {};
      if (req.reference) data.reference = req.reference;
      if (req.compagnie) data.compagnie = req.compagnie;
      if (req.typeBase) data.typeBase = req.typeBase;
      if (req.montantBrut) data.montantBrut = parseFloat(req.montantBrut);
      if (req.montantReprises) data.montantReprises = parseFloat(req.montantReprises);
      if (req.montantAcomptes) data.montantAcomptes = parseFloat(req.montantAcomptes);
      if (req.montantNetAPayer) data.montantNetAPayer = parseFloat(req.montantNetAPayer);
      if (req.statutId) data.statutId = req.statutId;
      
      const commission = await this.service.update(req.id, data);
      return { commission: this.toProto(commission) };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'DeleteCommission')
  async delete(req: GetByIdRequest): Promise<DeleteResponse> {
    try {
      await this.service.delete(req.id);
      return { success: true, message: 'Commission supprimee' };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  // Conversion entite -> proto (inline, simple)
  private toProto(c: CommissionEntity) {
    return {
      id: c.id,
      organisationId: c.organisationId,
      reference: c.reference,
      apporteurId: c.apporteurId,
      contratId: c.contratId,
      produitId: c.produitId || '',
      compagnie: c.compagnie,
      typeBase: c.typeBase,
      montantBrut: String(c.montantBrut),
      montantReprises: String(c.montantReprises),
      montantAcomptes: String(c.montantAcomptes),
      montantNetAPayer: String(c.montantNetAPayer),
      statutId: c.statutId,
      periode: c.periode,
      dateCreation: c.dateCreation?.toISOString() || '',
      createdAt: c.createdAt?.toISOString() || '',
      updatedAt: c.updatedAt?.toISOString() || '',
    };
  }
}
