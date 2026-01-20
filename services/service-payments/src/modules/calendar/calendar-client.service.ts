import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, ClientUnaryCall, ServiceError, credentials, loadPackageDefinition } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { join } from 'path';
import type { CalculatePlannedDateRequest, CalculatePlannedDateResponse } from '@proto/calendar/calendar';

type CalendarEngineServiceClient = {
  calculatePlannedDate(
    request: CalculatePlannedDateRequest,
    callback: (error: ServiceError | null, response: CalculatePlannedDateResponse) => void,
  ): ClientUnaryCall;
};

@Injectable()
export class CalendarClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CalendarClientService.name);
  private client: CalendarEngineServiceClient | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const url = this.configService.get<string>('CALENDAR_GRPC_URL', 'localhost:50070');
    const protoPath = join(process.cwd(), 'proto/calendar/calendar.proto');

    const packageDef = loadSync(protoPath, {
      keepCase: false,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const grpcObj = loadPackageDefinition(packageDef) as any;
    const CalendarEngineService = grpcObj.calendar.CalendarEngineService as typeof Client;
    this.client = new CalendarEngineService(url, credentials.createInsecure()) as CalendarEngineServiceClient;

    this.logger.log(`Calendar gRPC client connected to ${url}`);
  }

  onModuleDestroy(): void {
    const client = this.client as Client | null;
    if (client) {
      client.close();
    }
  }

  async calculatePlannedDate(
    request: CalculatePlannedDateRequest,
  ): Promise<CalculatePlannedDateResponse> {
    if (!this.client) {
      throw new Error('Calendar client not initialized');
    }

    return new Promise((resolve, reject) => {
      this.client!.calculatePlannedDate(request, (error, response) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(response);
      });
    });
  }
}
