import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ColisService } from '../../../../infrastructure/persistence/typeorm/repositories/logistics';
import { ColisEntity } from '../../../../domain/logistics/entities';
import type {
  CreateColisRequest,
  ColisResponse,
  GetByIdRequest,
  GetByExpeditionIdRequest,
  ColisListResponse,
  UpdateColisRequest,
  DeleteResponse,
} from '@crm/proto/logistics';

@Controller()
export class ColisController {
  private readonly logger = new Logger(ColisController.name);

  constructor(private readonly colisService: ColisService) {}

  @GrpcMethod('LogisticsService', 'CreateColis')
  async createColis(data: CreateColisRequest): Promise<ColisResponse> {
    this.logger.log(`CreateColis for expedition: ${data.expeditionId}`);

    const colis = await this.colisService.create({
      expeditionId: data.expeditionId,
      poidsGr: data.poidsGr,
      longCm: data.longCm,
      largCm: data.largCm,
      hautCm: data.hautCm,
      valeurDeclaree: data.valeurDeclaree,
      contenu: data.contenu,
    });

    return this.mapToResponse(colis);
  }

  @GrpcMethod('LogisticsService', 'GetColis')
  async getColis(data: GetByIdRequest): Promise<ColisResponse> {
    this.logger.log(`GetColis: ${data.id}`);

    const colis = await this.colisService.findById(data.id);
    if (!colis) {
      throw new Error('Colis not found');
    }

    return this.mapToResponse(colis);
  }

  @GrpcMethod('LogisticsService', 'GetColisByExpedition')
  async getColisByExpedition(data: GetByExpeditionIdRequest): Promise<ColisListResponse> {
    this.logger.log(`GetColisByExpedition: ${data.expeditionId}`);

    const colisList = await this.colisService.findByExpeditionId(data.expeditionId);

    return {
      colis: colisList.map((c) => this.mapToResponse(c)),
      total: colisList.length,
    };
  }

  @GrpcMethod('LogisticsService', 'UpdateColis')
  async updateColis(data: UpdateColisRequest): Promise<ColisResponse> {
    this.logger.log(`UpdateColis: ${data.id}`);

    const colis = await this.colisService.update(data.id, {
      poidsGr: data.poidsGr,
      longCm: data.longCm,
      largCm: data.largCm,
      hautCm: data.hautCm,
      valeurDeclaree: data.valeurDeclaree,
      contenu: data.contenu,
    });

    return this.mapToResponse(colis);
  }

  @GrpcMethod('LogisticsService', 'DeleteColis')
  async deleteColis(data: GetByIdRequest): Promise<DeleteResponse> {
    this.logger.log(`DeleteColis: ${data.id}`);

    await this.colisService.delete(data.id);
    return { success: true, message: 'Colis deleted successfully' };
  }

  private mapToResponse(colis: ColisEntity): ColisResponse {
    return {
      id: colis.id,
      expeditionId: colis.expeditionId,
      poidsGr: colis.poidsGr,
      longCm: colis.longCm,
      largCm: colis.largCm,
      hautCm: colis.hautCm,
      valeurDeclaree: Number(colis.valeurDeclaree),
      contenu: colis.contenu,
      createdAt: colis.createdAt?.toISOString() ?? '',
      updatedAt: colis.updatedAt?.toISOString() ?? '',
    };
  }
}
