import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, ClientGrpc, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { Observable, lastValueFrom, timeout, catchError, of } from 'rxjs';

interface SetupGoCardlessMandateRequest {
  societeId: string;
  clientId: string;
  description?: string;
  successRedirectUrl: string;
  scheme?: string;
}

interface GoCardlessMandateResponse {
  id: string;
  clientId: string;
  mandateId: string;
  status: string;
  scheme: string;
  redirectUrl?: string;
}

interface PaymentServiceClient {
  SetupGoCardlessMandate(request: SetupGoCardlessMandateRequest): Observable<GoCardlessMandateResponse>;
  GetGoCardlessMandate(request: { societeId: string; clientId: string }): Observable<GoCardlessMandateResponse>;
}

@Injectable()
export class PaymentClientService implements OnModuleInit {
  private readonly logger = new Logger(PaymentClientService.name);
  private paymentService: PaymentServiceClient;
  private client: ClientGrpc;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const paymentServiceUrl = this.configService.get<string>(
      'PAYMENT_SERVICE_URL',
      'localhost:50057',
    );

    this.logger.log(`Connecting to payment service at ${paymentServiceUrl}`);
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
          `Active mandate already exists for client ${params.clientId}: ${existingMandate.mandateId}`,
        );
        return { mandateId: existingMandate.mandateId, redirectUrl: '' };
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
        mandateId: response.id,
        redirectUrl: response.redirectUrl || '',
      };
    } catch (error: any) {
      this.logger.error(`Failed to setup mandate: ${error.message}`);
      return null;
    }
  }

  private async setupMandate(
    request: SetupGoCardlessMandateRequest,
  ): Promise<GoCardlessMandateResponse | null> {
    if (!this.paymentService) {
      this.logger.warn('Payment service client not initialized');
      return null;
    }

    try {
      const response = await lastValueFrom(
        this.paymentService.SetupGoCardlessMandate(request).pipe(
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

  private async getExistingMandate(
    societeId: string,
    clientId: string,
  ): Promise<GoCardlessMandateResponse | null> {
    if (!this.paymentService) {
      return null;
    }

    try {
      const response = await lastValueFrom(
        this.paymentService.GetGoCardlessMandate({ societeId, clientId }).pipe(
          timeout(5000),
          catchError(() => of(null)),
        ),
      );

      return response;
    } catch {
      return null;
    }
  }
}
