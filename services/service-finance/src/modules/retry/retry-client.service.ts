import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@grpc/grpc-js';
import { createGrpcClient } from '@crm/grpc-utils';
import type { HandleRejectionResponse } from '@crm/proto/retry';
import type { PaymentRejectedEvent } from '@crm/proto/retry/types';

export type HandlePaymentRejectedRequest = PaymentRejectedEvent;
export type HandlePaymentRejectedResponse = HandleRejectionResponse;

@Injectable()
export class RetryClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RetryClientService.name);
  private client: any = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const url = this.configService.get<string>('RETRY_GRPC_URL', 'service-retry:50070');

    try {
      this.client = createGrpcClient('retry', 'RetrySchedulerService', { url });
      this.logger.log(`Retry gRPC client connected to ${url}`);
    } catch (error) {
      this.logger.warn(`Failed to connect to Retry service: ${error}`);
    }
  }

  onModuleDestroy(): void {
    if (this.client) {
      (this.client as Client).close();
    }
  }

  async handlePaymentRejected(
    request: HandlePaymentRejectedRequest,
  ): Promise<HandlePaymentRejectedResponse> {
    if (!this.client) {
      throw new Error('Retry client not initialized');
    }

    return new Promise((resolve, reject) => {
      this.client.handlePaymentRejected(request, (error: any, response: HandlePaymentRejectedResponse) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(response);
      });
    });
  }
}
