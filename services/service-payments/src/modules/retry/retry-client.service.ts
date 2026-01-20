import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, credentials } from '@grpc/grpc-js';
import type { HandleRejectionResponse } from '@proto/retry/am04_retry_service';
import type { PaymentRejectedEvent } from '@proto/retry/am04_retry';
import { RetrySchedulerServiceClient } from '@proto-grpc/retry/am04_retry_service';

export type HandlePaymentRejectedRequest = PaymentRejectedEvent;
export type HandlePaymentRejectedResponse = HandleRejectionResponse;

@Injectable()
export class RetryClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RetryClientService.name);
  private client: RetrySchedulerServiceClient | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const url = this.configService.get<string>('RETRY_GRPC_URL', 'localhost:50059');
    this.client = new RetrySchedulerServiceClient(url, credentials.createInsecure());

    this.logger.log(`Retry gRPC client connected to ${url}`);
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
