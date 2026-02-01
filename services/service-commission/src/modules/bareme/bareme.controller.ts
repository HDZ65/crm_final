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
        organisationId: req.organisationId,
        code: req.code,
        nom: req.nom,
        description: req.description || undefined,
        typeCalcul: grpcToTypeCalcul(req.typeCalcul),
        baseCalcul: grpcToBaseCalcul(req.baseCalcul),
        montantFixe: req.montantFixe ? parseFloat(req.montantFixe) : undefined,
        tauxPourcentage: req.tauxPourcentage ? parseFloat(req.tauxPourcentage) : undefined,
        recurrenceActive: req.recurrenceActive || false,
        tauxRecurrence: req.tauxRecurrence ? parseFloat(req.tauxRecurrence) : undefined,
        dureeRecurrenceMois: req.dureeRecurrenceMois || undefined,
        dureeReprisesMois: req.dureeReprisesMois || 3,
        tauxReprise: req.tauxReprise ? parseFloat(req.tauxReprise) : 100,
        typeProduit: req.typeProduit || undefined,
        profilRemuneration: req.profilRemuneration || undefined,
        societeId: req.societeId || undefined,
        canalVente: req.canalVente || undefined,
        repartitionCommercial: parseFloat(req.repartitionCommercial || '100'),
        repartitionManager: parseFloat(req.repartitionManager || '0'),
        repartitionAgence: parseFloat(req.repartitionAgence || '0'),
        repartitionEntreprise: parseFloat(req.repartitionEntreprise || '0'),
        dateEffet: new Date(req.dateEffet),
        dateFin: req.dateFin ? new Date(req.dateFin) : undefined,
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
      const { baremes, total } = await this.service.findByOrganisation(req.organisationId, {
        actifOnly: req.actifOnly,
        typeProduit: req.typeProduit,
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
      const bareme = await this.service.findApplicable(req.organisationId, {
        typeProduit: req.typeProduit,
        profilRemuneration: req.profilRemuneration,
        societeId: req.societeId,
        canalVente: req.canalVente,
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
      if (req.typeCalcul) data.typeCalcul = grpcToTypeCalcul(req.typeCalcul);
      if (req.baseCalcul) data.baseCalcul = grpcToBaseCalcul(req.baseCalcul);
      if (req.montantFixe) data.montantFixe = parseFloat(req.montantFixe);
      if (req.tauxPourcentage) data.tauxPourcentage = parseFloat(req.tauxPourcentage);
      if (req.recurrenceActive !== undefined) data.recurrenceActive = req.recurrenceActive;
      if (req.dateFin) data.dateFin = new Date(req.dateFin);
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
