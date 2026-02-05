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
        organisationId: req.organisation_id,
        baremeId: req.bareme_id,
        code: req.code,
        nom: req.nom,
        description: req.description || undefined,
        typePalier: grpcToTypePalier(req.type_palier),
        seuilMin: parseFloat(req.seuil_min),
        seuilMax: req.seuil_max ? parseFloat(req.seuil_max) : undefined,
        montantPrime: parseFloat(req.montant_prime),
        tauxBonus: req.taux_bonus ? parseFloat(req.taux_bonus) : undefined,
        cumulable: req.cumulable || false,
        parPeriode: req.par_periode !== false,
        typeProduit: req.type_produit || undefined,
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
      const { paliers, total } = await this.service.findByBareme(req.bareme_id);
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
      if (req.seuil_min) data.seuil_min = parseFloat(req.seuil_min);
      if (req.seuil_max) data.seuil_max = parseFloat(req.seuil_max);
      if (req.montant_prime) data.montantPrime = parseFloat(req.montant_prime);
      if (req.taux_bonus) data.tauxBonus = parseFloat(req.taux_bonus);
      if (req.cumulable !== undefined) data.cumulable = req.cumulable;
      if (req.par_periode !== undefined) data.parPeriode = req.par_periode;
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
