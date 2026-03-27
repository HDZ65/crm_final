import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { TrackingService } from '../persistence/typeorm/repositories/logistics';
import type {
  CreateTrackingEventRequest,
  TrackingEventResponse,
  GetByExpeditionIdRequest,
  TrackingEventListResponse,
} from '@proto/logistics';

@Controller()
export class TrackingController {
  private readonly logger = new Logger(TrackingController.name);

  constructor(private readonly trackingService: TrackingService) {}

  @GrpcMethod('LogisticsService', 'CreateTrackingEvent')
  async createTrackingEvent(data: CreateTrackingEventRequest): Promise<TrackingEventResponse> {
    this.logger.log(`CreateTrackingEvent for expedition: ${data.expedition_id}`);

    const event = await this.trackingService.create({
      expeditionId: data.expedition_id,
      code: data.code,
      label: data.label,
      dateEvenement: data.date_evenement,
      lieu: data.lieu,
      raw: data.raw,
    });

    return {
      id: event.id,
      expedition_id: event.expeditionId,
      code: event.code,
      label: event.label,
      date_evenement: event.dateEvenement,
      lieu: event.lieu ?? undefined,
      raw: event.raw ?? undefined,
      created_at: event.createdAt?.toISOString() ?? '',
    };
  }

  @GrpcMethod('LogisticsService', 'GetTrackingEvents')
  async getTrackingEvents(data: GetByExpeditionIdRequest): Promise<TrackingEventListResponse> {
    this.logger.log(`GetTrackingEvents for expedition: ${data.expedition_id}`);

    const events = await this.trackingService.findByExpeditionId(data.expedition_id);

    return {
      events: events.map((e) => ({
        id: e.id,
        expedition_id: e.expeditionId,
        code: e.code,
        label: e.label,
        date_evenement: e.dateEvenement,
        lieu: e.lieu ?? undefined,
        raw: e.raw ?? undefined,
        created_at: e.createdAt?.toISOString() ?? '',
      })),
      total: events.length,
    };
  }

  @GrpcMethod('LogisticsService', 'GetLatestTrackingEvent')
  async getLatestTrackingEvent(data: GetByExpeditionIdRequest): Promise<TrackingEventResponse> {
    this.logger.log(`GetLatestTrackingEvent for expedition: ${data.expedition_id}`);

    const event = await this.trackingService.findLatestByExpeditionId(data.expedition_id);
    if (!event) {
      throw new RpcException({ code: status.NOT_FOUND, message: 'No tracking events found' });
    }

    return {
      id: event.id,
      expedition_id: event.expeditionId,
      code: event.code,
      label: event.label,
      date_evenement: event.dateEvenement,
      lieu: event.lieu ?? undefined,
      raw: event.raw ?? undefined,
      created_at: event.createdAt?.toISOString() ?? '',
    };
  }
}
