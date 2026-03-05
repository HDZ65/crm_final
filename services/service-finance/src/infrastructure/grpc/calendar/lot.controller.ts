import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  CreateLotRequest,
  GetLotRequest,
  ListLotsRequest,
  ListLotsResponse,
  UpdateLotRequest,
  DeactivateLotRequest,
  ReactivateLotRequest,
  DebitLotMessage,
} from '@proto/calendar';
import { LotService } from '../../persistence/typeorm/repositories/calendar/lot.service';
import { DebitLotEntity } from '../../../domain/calendar/entities';

@Controller()
export class LotController {
  constructor(private readonly lotService: LotService) {}

  @GrpcMethod('DebitLotService', 'CreateLot')
  async createLot(data: CreateLotRequest): Promise<DebitLotMessage> {
    const lot = await this.lotService.createLot({
      organisationId: data.organisation_id,
      societeId: data.societe_id,
      name: data.name,
      startDay: data.start_day,
      endDay: data.end_day,
      description: data.description,
      displayOrder: data.display_order,
    });
    return this.toProto(lot);
  }

  @GrpcMethod('DebitLotService', 'GetLot')
  async getLot(data: GetLotRequest): Promise<DebitLotMessage> {
    const lot = await this.lotService.getLot(data.id, data.organisation_id);
    return this.toProto(lot);
  }

  @GrpcMethod('DebitLotService', 'ListLots')
  async listLots(data: ListLotsRequest): Promise<ListLotsResponse> {
    const lots = await this.lotService.listLots(
      data.organisation_id,
      data.societe_id,
      data.include_inactive,
    );
    return { lots: lots.map((lot) => this.toProto(lot)) };
  }

  @GrpcMethod('DebitLotService', 'UpdateLot')
  async updateLot(data: UpdateLotRequest): Promise<DebitLotMessage> {
    const lot = await this.lotService.updateLot(data.id, data.organisation_id, {
      name: data.name,
      startDay: data.start_day,
      endDay: data.end_day,
      description: data.description,
      displayOrder: data.display_order,
    });
    return this.toProto(lot);
  }

  @GrpcMethod('DebitLotService', 'DeactivateLot')
  async deactivateLot(data: DeactivateLotRequest): Promise<DebitLotMessage> {
    const lot = await this.lotService.deactivateLot(data.id, data.organisation_id);
    return this.toProto(lot);
  }

  @GrpcMethod('DebitLotService', 'ReactivateLot')
  async reactivateLot(data: ReactivateLotRequest): Promise<DebitLotMessage> {
    const lot = await this.lotService.reactivateLot(data.id, data.organisation_id);
    return this.toProto(lot);
  }

  private toProto(lot: DebitLotEntity): DebitLotMessage {
    return {
      id: lot.id,
      organisation_id: lot.organisationId,
      societe_id: lot.societeId,
      name: lot.name,
      start_day: lot.startDay,
      end_day: lot.endDay,
      description: lot.description ?? '',
      is_active: lot.isActive,
      display_order: lot.displayOrder,
      created_at: lot.createdAt?.toISOString?.() ?? '',
      updated_at: lot.updatedAt?.toISOString?.() ?? '',
    };
  }
}
