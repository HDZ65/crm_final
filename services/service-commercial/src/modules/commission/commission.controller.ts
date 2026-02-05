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
        organisationId: req.organisation_id,
        reference: req.reference,
        apporteurId: req.apporteur_id,
        contratId: req.contrat_id,
        produitId: req.produit_id || undefined,
        compagnie: req.compagnie,
        typeBase: req.type_base,
        montantBrut: parseFloat(req.montant_brut),
        montantReprises: parseFloat(req.montant_reprises || '0'),
        montantAcomptes: parseFloat(req.montant_acomptes || '0'),
        montantNetAPayer: parseFloat(req.montant_net_a_payer),
        statutId: req.statut_id,
        periode: req.periode,
        dateCreation: new Date(req.date_creation),
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
      const { commissions, total } = await this.service.findByOrganisation(req.organisation_id, {
        apporteurId: req.apporteur_id,
        periode: req.periode,
        statutId: req.statut_id,
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
      if (req.type_base) data.type_base = req.type_base;
      if (req.montant_brut) data.montant_brut = parseFloat(req.montant_brut);
      if (req.montant_reprises) data.montant_reprises = parseFloat(req.montant_reprises);
      if (req.montant_acomptes) data.montant_acomptes = parseFloat(req.montant_acomptes);
      if (req.montant_net_a_payer) data.montant_net_a_payer = parseFloat(req.montant_net_a_payer);
      if (req.statut_id) data.statut_id = req.statut_id;
      
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
      organisation_id: c.organisationId,
      reference: c.reference,
      apporteur_id: c.apporteurId,
      contrat_id: c.contratId,
      produit_id: c.produitId || '',
      compagnie: c.compagnie,
      type_base: c.typeBase,
      montant_brut: String(c.montantBrut),
      montant_reprises: String(c.montantReprises),
      montant_acomptes: String(c.montantAcomptes),
      montant_net_a_payer: String(c.montantNetAPayer),
      statut_id: c.statutId,
      periode: c.periode,
      date_creation: c.dateCreation?.toISOString() || '',
      created_at: c.createdAt?.toISOString() || '',
      updated_at: c.updatedAt?.toISOString() || '',
    };
  }
}
