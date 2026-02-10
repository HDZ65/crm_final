import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ColisService } from '../persistence/typeorm/repositories/logistics';
import type {
  CreateColisRequest,
  ColisResponse,
  GetByIdRequest,
  GetByExpeditionIdRequest,
  ColisListResponse,
  UpdateColisRequest,
  DeleteResponse,
} from '@proto/logistics';

@Controller()
export class ColisController {
  private readonly logger = new Logger(ColisController.name);

  constructor(private readonly colisService: ColisService) {}

  @GrpcMethod('LogisticsService', 'CreateColis')
  async createColis(data: CreateColisRequest): Promise<ColisResponse> {
    this.logger.log(`CreateColis for expedition: ${data.expedition_id}`);

    const colis = await this.colisService.create({
      expeditionId: data.expedition_id,
      poidsGr: data.poids_gr,
      longCm: data.long_cm,
      largCm: data.larg_cm,
      hautCm: data.haut_cm,
      valeurDeclaree: data.valeur_declaree,
      contenu: data.contenu,
    });

    return {
      id: colis.id,
      expedition_id: colis.expeditionId,
      poids_gr: colis.poidsGr,
      long_cm: colis.longCm,
      larg_cm: colis.largCm,
      haut_cm: colis.hautCm,
      valeur_declaree: Number(colis.valeurDeclaree),
      contenu: colis.contenu,
      created_at: colis.createdAt?.toISOString() ?? '',
      updated_at: colis.updatedAt?.toISOString() ?? '',
    };
  }

  @GrpcMethod('LogisticsService', 'GetColis')
  async getColis(data: GetByIdRequest): Promise<ColisResponse> {
    this.logger.log(`GetColis: ${data.id}`);

    const colis = await this.colisService.findById(data.id);
    if (!colis) {
      throw new RpcException({ code: status.NOT_FOUND, message: 'Colis not found' });
    }

    return {
      id: colis.id,
      expedition_id: colis.expeditionId,
      poids_gr: colis.poidsGr,
      long_cm: colis.longCm,
      larg_cm: colis.largCm,
      haut_cm: colis.hautCm,
      valeur_declaree: Number(colis.valeurDeclaree),
      contenu: colis.contenu,
      created_at: colis.createdAt?.toISOString() ?? '',
      updated_at: colis.updatedAt?.toISOString() ?? '',
    };
  }

  @GrpcMethod('LogisticsService', 'GetColisByExpedition')
  async getColisByExpedition(data: GetByExpeditionIdRequest): Promise<ColisListResponse> {
    this.logger.log(`GetColisByExpedition: ${data.expedition_id}`);

    const colisList = await this.colisService.findByExpeditionId(data.expedition_id);

    return {
      colis: colisList.map((c) => ({
        id: c.id,
        expedition_id: c.expeditionId,
        poids_gr: c.poidsGr,
        long_cm: c.longCm,
        larg_cm: c.largCm,
        haut_cm: c.hautCm,
        valeur_declaree: Number(c.valeurDeclaree),
        contenu: c.contenu,
        created_at: c.createdAt?.toISOString() ?? '',
        updated_at: c.updatedAt?.toISOString() ?? '',
      })),
      total: colisList.length,
    };
  }

  @GrpcMethod('LogisticsService', 'UpdateColis')
  async updateColis(data: UpdateColisRequest): Promise<ColisResponse> {
    this.logger.log(`UpdateColis: ${data.id}`);

    const colis = await this.colisService.update(data.id, {
      poidsGr: data.poids_gr,
      longCm: data.long_cm,
      largCm: data.larg_cm,
      hautCm: data.haut_cm,
      valeurDeclaree: data.valeur_declaree,
      contenu: data.contenu,
    });

    return {
      id: colis.id,
      expedition_id: colis.expeditionId,
      poids_gr: colis.poidsGr,
      long_cm: colis.longCm,
      larg_cm: colis.largCm,
      haut_cm: colis.hautCm,
      valeur_declaree: Number(colis.valeurDeclaree),
      contenu: colis.contenu,
      created_at: colis.createdAt?.toISOString() ?? '',
      updated_at: colis.updatedAt?.toISOString() ?? '',
    };
  }

  @GrpcMethod('LogisticsService', 'DeleteColis')
  async deleteColis(data: GetByIdRequest): Promise<DeleteResponse> {
    this.logger.log(`DeleteColis: ${data.id}`);

    await this.colisService.delete(data.id);
    return { success: true, message: 'Colis deleted successfully' };
  }
}
