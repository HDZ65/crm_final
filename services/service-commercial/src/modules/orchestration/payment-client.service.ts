import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@grpc/grpc-js';
import { createGrpcClient } from '@crm/grpc-utils';
import { timeout, catchError, of, from, lastValueFrom } from 'rxjs';
import type {
  SetupGoCardlessMandateRequest as ProtoSetupGoCardlessMandateRequest,
  GoCardlessMandateResponse,
  GetGoCardlessMandateRequest,
} from '@crm/proto/payments';

type SetupGoCardlessMandateRequest = Partial<ProtoSetupGoCardlessMandateRequest> & {
  societeId: string;
  clientId: string;
  successRedirectUrl: string;
};

@Injectable()
export class PaymentClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentClientService.name);
  private client: any = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('PAYMENT_SERVICE_URL', 'service-payments:50063');

    try {
      this.client = createGrpcClient('payments', 'GoCardlessService', { url });
      this.logger.log(`Payment gRPC client connected to ${url}`);
    } catch (error) {
      this.logger.warn(`Failed to connect to Payment service: ${error}`);
    }
  }

  onModuleDestroy(): void {
    if (this.client) {
      (this.client as Client).close();
    }
  }

  async setupMandateForContract(params: {
    societeId: string;
    clientId: string;
    contratId: string;
    contratReference: string;
    redirectBaseUrl: string;
  }): Promise<{ mandateId: string; redirectUrl: string } | null> {
    try {
      const existingMandate = await this.getExistingMandate(
        params.societeId,
        params.clientId,
      );

       if (existingMandate && existingMandate.status === 'active') {
         this.logger.log(
           `Active mandate already exists for client ${params.clientId}: ${existingMandate.mandate_id}`,
         );
         return { mandateId: existingMandate.mandate_id, redirectUrl: '' };
       }

      const successUrl = `${params.redirectBaseUrl}/contrats/${params.contratId}/mandate-callback`;

      const response = await this.setupMandate({
        societeId: params.societeId,
        clientId: params.clientId,
        description: `Mandat SEPA pour contrat ${params.contratReference}`,
        successRedirectUrl: successUrl,
        scheme: 'sepa_core',
      });

      if (!response) {
        this.logger.warn('Failed to setup mandate - payment service unavailable');
        return null;
      }

      this.logger.log(
        `Mandate setup initiated for contract ${params.contratId}: ${response.id}`,
      );

       return {
         mandateId: response.mandate_id,
         redirectUrl: response.redirect_url || '',
       };
    } catch (error: any) {
      this.logger.error(`Failed to setup mandate: ${error.message}`);
      return null;
    }
  }

  private async setupMandate(
    request: SetupGoCardlessMandateRequest,
  ): Promise<GoCardlessMandateResponse | null> {
    if (!this.client) {
      this.logger.warn('Payment service client not initialized');
      return null;
    }

    try {
      const response = await lastValueFrom(
        from(this.callSetupGoCardlessMandate(request)).pipe(
          timeout(10000),
          catchError((err) => {
            this.logger.error(`gRPC call failed: ${err.message}`);
            return of(null);
          }),
        ),
      );

      return response;
    } catch (error: any) {
      this.logger.error(`Failed to setup mandate: ${error.message}`);
      return null;
    }
  }

  private callSetupGoCardlessMandate(request: SetupGoCardlessMandateRequest): Promise<GoCardlessMandateResponse> {
    return new Promise((resolve, reject) => {
      this.client.setupGoCardlessMandate(request, (error: any, response: GoCardlessMandateResponse) => {
        if (error) reject(error);
        else resolve(response);
      });
    });
  }

  private async getExistingMandate(
    societeId: string,
    clientId: string,
  ): Promise<GoCardlessMandateResponse | null> {
    if (!this.client) {
      return null;
    }

    try {
       const response = await lastValueFrom(
         from(this.callGetGoCardlessMandate({ societe_id: societeId, client_id: clientId })).pipe(
           timeout(5000),
           catchError(() => of(null)),
         ),
       );

      return response;
    } catch {
      return null;
    }
  }

  private callGetGoCardlessMandate(request: GetGoCardlessMandateRequest): Promise<GoCardlessMandateResponse> {
    return new Promise((resolve, reject) => {
      this.client.getGoCardlessMandate(request, (error: any, response: GoCardlessMandateResponse) => {
        if (error) reject(error);
        else resolve(response);
      });
    });
  }
}
