import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { PalierService } from './palier.service';
import { TypePalier } from './entities/palier-commission.entity';

import type {
  CreatePalierRequest,
  GetByIdRequest,
  GetByBaremeRequest,
  UpdatePalierRequest,
  PalierResponse,
  PalierListResponse,
  DeleteResponse,
} from '@crm/proto/commission';

const grpcToTypePalier = (n: number): TypePalier =>
  [TypePalier.VOLUME, TypePalier.VOLUME, TypePalier.CA, TypePalier.PRIME_PRODUIT][n] || TypePalier.VOLUME;

@Controller()
export class PalierController {
  constructor(private readonly service: PalierService) {}

  @GrpcMethod('CommissionService', 'CreatePalier')
  async create(req: CreatePalierRequest): Promise<PalierResponse> {
    try {
      const palier = await this.service.create({
        organisationId: req.organisationId,
        baremeId: req.baremeId,
        code: req.code,
        nom: req.nom,
        description: req.description || undefined,
        typePalier: grpcToTypePalier(req.typePalier),
        seuilMin: parseFloat(req.seuilMin),
        seuilMax: req.seuilMax ? parseFloat(req.seuilMax) : undefined,
        montantPrime: parseFloat(req.montantPrime),
        tauxBonus: req.tauxBonus ? parseFloat(req.tauxBonus) : undefined,
        cumulable: req.cumulable || false,
        parPeriode: req.parPeriode !== false,
        typeProduit: req.typeProduit || undefined,
        ordre: req.ordre || 0,
      });
      return { palier: palier as unknown as PalierResponse['palier'] };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'GetPalier')
  async get(req: GetByIdRequest): Promise<PalierResponse> {
    try {
      const palier = await this.service.findById(req.id);
      return { palier: palier as unknown as PalierResponse['palier'] };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'GetPaliersByBareme')
  async listByBareme(req: GetByBaremeRequest): Promise<PalierListResponse> {
    try {
      const { paliers, total } = await this.service.findByBareme(req.baremeId);
      return { paliers: paliers as unknown as PalierListResponse['paliers'], total };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'UpdatePalier')
  async update(req: UpdatePalierRequest): Promise<PalierResponse> {
    try {
      const data: Record<string, unknown> = {};
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

      const palier = await this.service.update(req.id, data);
      return { palier: palier as unknown as PalierResponse['palier'] };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'DeletePalier')
  async delete(req: GetByIdRequest): Promise<DeleteResponse> {
    try {
      await this.service.delete(req.id);
      return { success: true, message: 'Palier supprime' };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }
}
