import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { EnergieLifecycleService } from '../../../domain/energie/services/energie-lifecycle.service';
import { RaccordementEnergieRepositoryService } from '../../persistence/typeorm/repositories/energie';
import {
  RaccordementEnergieEntity,
  PartenaireEnergie,
  StatutRaccordement,
} from '../../../domain/energie/entities/raccordement-energie.entity';

@Controller()
export class EnergieController {
  private readonly logger = new Logger(EnergieController.name);

  constructor(
    private readonly lifecycleService: EnergieLifecycleService,
    private readonly raccordementRepository: RaccordementEnergieRepositoryService,
  ) {}

  @GrpcMethod('EnergieService', 'CreateRaccordement')
  async createRaccordement(data: {
    client_id: string;
    contrat_id: string;
    partenaire: number;
    adresse?: string;
    pdl_pce?: string;
  }) {
    this.logger.log(
      `CreateRaccordement: client=${data.client_id}, contrat=${data.contrat_id}`,
    );

    const partenaire = this.mapPartenaireFromProto(data.partenaire);
    const raccordement = await this.lifecycleService.createRaccordement(
      data.client_id,
      data.contrat_id,
      partenaire,
      data.adresse,
    );

    return { raccordement: this.toProto(raccordement) };
  }

  @GrpcMethod('EnergieService', 'UpdateRaccordementStatus')
  async updateRaccordementStatus(data: {
    id: string;
    statut_raccordement: number;
    statut_activation?: string;
  }) {
    this.logger.log(
      `UpdateRaccordementStatus: id=${data.id}, status=${data.statut_raccordement}`,
    );

    try {
      const newStatus = this.mapStatusFromProto(data.statut_raccordement);
      const raccordement = await this.lifecycleService.updateStatus(data.id, newStatus);
      return { raccordement: this.toProto(raccordement) };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('not found')) {
        throw new RpcException({ code: status.NOT_FOUND, message });
      }
      throw error;
    }
  }

  @GrpcMethod('EnergieService', 'GetRaccordement')
  async getRaccordement(data: { id: string }) {
    this.logger.log(`GetRaccordement: id=${data.id}`);

    try {
      const raccordement = await this.raccordementRepository.findById(data.id);
      return { raccordement: this.toProto(raccordement) };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('not found')) {
        throw new RpcException({ code: status.NOT_FOUND, message });
      }
      throw error;
    }
  }

  @GrpcMethod('EnergieService', 'ListRaccordementsByClient')
  async listRaccordementsByClient(data: {
    client_id: string;
    pagination?: { page?: number; limit?: number; sort_by?: string; sort_order?: string };
  }) {
    this.logger.log(`ListRaccordementsByClient: client=${data.client_id}`);

    const raccordements = await this.raccordementRepository.findByClientId(data.client_id);

    const page = data.pagination?.page || 1;
    const limit = data.pagination?.limit || 50;
    const start = (page - 1) * limit;
    const paged = raccordements.slice(start, start + limit);

    return {
      raccordements: paged.map((r) => this.toProto(r)),
      pagination: {
        total: raccordements.length,
        page,
        limit,
        total_pages: Math.ceil(raccordements.length / limit),
      },
    };
  }

  @GrpcMethod('EnergieService', 'GetActivationStatus')
  async getActivationStatus(data: { id: string }) {
    this.logger.log(`GetActivationStatus: id=${data.id}`);

    try {
      const raccordement = await this.raccordementRepository.findById(data.id);
      return { raccordement: this.toProto(raccordement) };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('not found')) {
        throw new RpcException({ code: status.NOT_FOUND, message });
      }
      throw error;
    }
  }

  private toProto(entity: RaccordementEnergieEntity) {
    return {
      id: entity.id,
      client_id: entity.clientId,
      contrat_id: entity.contratId,
      partenaire: this.mapPartenaireToProto(entity.partenaire),
      statut_raccordement: this.mapStatusToProto(entity.statutRaccordement),
      statut_activation: entity.statutActivation ?? '',
      adresse: entity.adresse ?? '',
      pdl_pce: entity.pdlPce ?? '',
      date_demande: entity.dateDemande?.toISOString() ?? '',
      date_activation: entity.dateActivation?.toISOString() ?? undefined,
      created_at: entity.createdAt?.toISOString() ?? '',
      updated_at: entity.updatedAt?.toISOString() ?? '',
    };
  }

  private mapPartenaireToProto(partenaire: PartenaireEnergie): number {
    const map: Record<string, number> = {
      PLENITUDE: 1,
      OHM: 2,
    };
    return map[partenaire] ?? 0;
  }

  private mapPartenaireFromProto(value: number): PartenaireEnergie {
    const map: Record<number, PartenaireEnergie> = {
      1: PartenaireEnergie.PLENITUDE,
      2: PartenaireEnergie.OHM,
    };
    const result = map[value];
    if (!result) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: `Invalid partenaire value: ${value}`,
      });
    }
    return result;
  }

  private mapStatusToProto(statut: StatutRaccordement): number {
    const map: Record<string, number> = {
      DEMANDE_ENVOYEE: 1,
      EN_COURS: 2,
      RACCORDE: 3,
      ACTIVE: 4,
      SUSPENDU: 5,
      RESILIE: 6,
      ERREUR: 7,
    };
    return map[statut] ?? 0;
  }

  private mapStatusFromProto(value: number): StatutRaccordement {
    const map: Record<number, StatutRaccordement> = {
      1: StatutRaccordement.DEMANDE_ENVOYEE,
      2: StatutRaccordement.EN_COURS,
      3: StatutRaccordement.RACCORDE,
      4: StatutRaccordement.ACTIVE,
      5: StatutRaccordement.SUSPENDU,
      6: StatutRaccordement.RESILIE,
      7: StatutRaccordement.ERREUR,
    };
    const result = map[value];
    if (!result) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: `Invalid raccordement status value: ${value}`,
      });
    }
    return result;
  }
}
