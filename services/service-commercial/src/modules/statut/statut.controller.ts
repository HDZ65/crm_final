import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { StatutService } from './statut.service';

import type {
  CreateStatutRequest,
  GetByIdRequest,
  GetStatutsRequest,
  GetStatutByCodeRequest,
  UpdateStatutRequest,
  StatutResponse,
  StatutListResponse,
  DeleteResponse,
} from '@crm/proto/commission';

@Controller()
export class StatutController {
  constructor(private readonly service: StatutService) {}

  @GrpcMethod('CommissionService', 'CreateStatut')
  async create(req: CreateStatutRequest): Promise<StatutResponse> {
    try {
      const statut = await this.service.create({
        code: req.code,
        nom: req.nom,
        description: req.description || undefined,
        ordreAffichage: req.ordre_affichage || 0,
      });
      return { statut: statut as unknown as StatutResponse['statut'] };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'GetStatut')
  async get(req: GetByIdRequest): Promise<StatutResponse> {
    try {
      const statut = await this.service.findById(req.id);
      return { statut: statut as unknown as StatutResponse['statut'] };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'GetStatutByCode')
  async getByCode(req: GetStatutByCodeRequest): Promise<StatutResponse> {
    try {
      const statut = await this.service.findByCode(req.code);
      return { statut: statut as unknown as StatutResponse['statut'] };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'GetStatuts')
  async list(req: GetStatutsRequest): Promise<StatutListResponse> {
    try {
      const { statuts, total } = await this.service.findAll(req.limit, req.offset);
      return { statuts: statuts as unknown as StatutListResponse['statuts'], total };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'UpdateStatut')
  async update(req: UpdateStatutRequest): Promise<StatutResponse> {
    try {
      const data: Record<string, unknown> = {};
      if (req.nom) data.nom = req.nom;
      if (req.description !== undefined) data.description = req.description;
      if (req.ordre_affichage !== undefined) data.ordreAffichage = req.ordre_affichage;

      const statut = await this.service.update(req.id, data);
      return { statut: statut as unknown as StatutResponse['statut'] };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'DeleteStatut')
  async delete(req: GetByIdRequest): Promise<DeleteResponse> {
    try {
      await this.service.delete(req.id);
      return { success: true, message: 'Statut supprime' };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }
}
