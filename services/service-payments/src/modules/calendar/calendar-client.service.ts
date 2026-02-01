import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@grpc/grpc-js';
import { createGrpcClient } from '@crm/grpc-utils';
import type { CalculatePlannedDateRequest, CalculatePlannedDateResponse } from '@crm/proto/calendar';

@Injectable()
export class CalendarClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CalendarClientService.name);
  private client: any = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const url = this.configService.get<string>('CALENDAR_GRPC_URL', 'service-calendar:50068');

    try {
      this.client = createGrpcClient('calendar', 'CalendarEngineService', { url });
      this.logger.log(`Calendar gRPC client connected to ${url}`);
    } catch (error) {
      this.logger.warn(`Failed to connect to Calendar service: ${error}`);
    }
  }

  onModuleDestroy(): void {
    if (this.client) {
      (this.client as Client).close();
    }
  }

  async calculatePlannedDate(
    request: CalculatePlannedDateRequest,
  ): Promise<CalculatePlannedDateResponse> {
    if (!this.client) {
      throw new Error('Calendar client not initialized');
    }

    return new Promise((resolve, reject) => {
      this.client.calculatePlannedDate(request, (error: any, response: CalculatePlannedDateResponse) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(response);
      });
    });
  }
}
