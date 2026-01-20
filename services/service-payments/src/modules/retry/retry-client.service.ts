import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, ClientUnaryCall, ServiceError, credentials, loadPackageDefinition } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { join } from 'path';
import type { HandleRejectionResponse } from '@proto/retry/am04_retry_service';
import type { PaymentRejectedEvent } from '@proto/retry/am04_retry';

export type HandlePaymentRejectedRequest = PaymentRejectedEvent;
export type HandlePaymentRejectedResponse = HandleRejectionResponse;

type RetrySchedulerServiceClient = {
  handlePaymentRejected(
    request: HandlePaymentRejectedRequest,
    callback: (error: ServiceError | null, response: HandlePaymentRejectedResponse) => void,
  ): ClientUnaryCall;
};

@Injectable()
export class RetryClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RetryClientService.name);
  private client: RetrySchedulerServiceClient | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const url = this.configService.get<string>('RETRY_GRPC_URL', 'localhost:50059');
    const protoPath = join(process.cwd(), 'proto/src/retry/am04_retry_service.proto');
    const includeDirs = [join(process.cwd(), 'proto/src')];

    try {
      const packageDef = loadSync(protoPath, {
        keepCase: false,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs,
      });

      const grpcObj = loadPackageDefinition(packageDef) as any;
      const RetrySchedulerService = grpcObj.retry.RetrySchedulerService;
      this.client = new RetrySchedulerService(url, credentials.createInsecure()) as unknown as RetrySchedulerServiceClient;

      this.logger.log(`Retry gRPC client connected to ${url}`);
    } catch (error) {
      this.logger.warn(`Failed to connect to Retry service: ${error}`);
    }
  }

  onModuleDestroy(): void {
    const client = this.client as Client | null;
    if (client) {
      client.close();
    }
  }

  async handlePaymentRejected(
    request: HandlePaymentRejectedRequest,
  ): Promise<HandlePaymentRejectedResponse> {
    if (!this.client) {
      throw new Error('Retry client not initialized');
    }

    return new Promise((resolve, reject) => {
      this.client!.handlePaymentRejected(request, (error, response) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(response);
      });
    });
  }
}
