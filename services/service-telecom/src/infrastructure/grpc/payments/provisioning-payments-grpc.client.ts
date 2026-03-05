import { credentials, type ServiceError } from '@grpc/grpc-js';
import { getServiceUrl, loadGrpcPackage } from '@crm/shared-kernel';
import { Injectable } from '@nestjs/common';
import type { ProvisioningPaymentsPort } from '../../../domain/provisioning/services';

interface SetupMandateRequest {
  client_id: string;
  societe_id: string;
  scheme: string;
  description?: string;
  success_redirect_url: string;
  session_token?: string;
}

interface SetupMandateResponse {
  mandate_id: string;
}

interface CreateSubscriptionRequest {
  client_id: string;
  societe_id: string;
  amount: number;
  currency: string;
  interval_unit: string;
  interval: number;
  metadata: Record<string, string>;
}

interface CreateSubscriptionResponse {
  subscription_id: string;
}

interface CancelSubscriptionRequest {
  societe_id: string;
  subscription_id: string;
}

interface CancelSubscriptionResponse {
  status?: string;
}

interface PaymentServiceGrpcContract {
  SetupGoCardlessMandate(
    request: SetupMandateRequest,
    callback: (error: ServiceError | null, response?: SetupMandateResponse) => void,
  ): void;

  CreateGoCardlessSubscription(
    request: CreateSubscriptionRequest,
    callback: (
      error: ServiceError | null,
      response?: CreateSubscriptionResponse,
    ) => void,
  ): void;

  CancelGoCardlessSubscription(
    request: CancelSubscriptionRequest,
    callback: (
      error: ServiceError | null,
      response?: CancelSubscriptionResponse,
    ) => void,
  ): void;
}

@Injectable()
export class ProvisioningPaymentsGrpcClient implements ProvisioningPaymentsPort {
  private readonly client: PaymentServiceGrpcContract;

  constructor() {
    const grpcPackage = loadGrpcPackage('payments');
    const ServiceConstructor = grpcPackage?.payment?.PaymentService;
    if (!ServiceConstructor) {
      throw new Error(
        'PaymentService gRPC constructor not found in payments proto package',
      );
    }

    const url =
      process.env.FINANCE_GRPC_URL ||
      process.env.PAYMENTS_GRPC_URL ||
      getServiceUrl('payments');

    this.client = new ServiceConstructor(url, credentials.createInsecure());
  }

  async setupSepaMandate(input: {
    societeId: string;
    clientId: string;
    description: string;
    correlationId?: string;
  }): Promise<{ mandateId: string }> {
    const redirectUrl =
      process.env.TELECOM_MANDATE_SUCCESS_REDIRECT_URL ||
      'https://crm.local/mandate/success';

    const response = await new Promise<SetupMandateResponse>((resolve, reject) => {
      this.client.SetupGoCardlessMandate(
        {
          societe_id: input.societeId,
          client_id: input.clientId,
          scheme: 'sepa_core',
          description: input.description,
          success_redirect_url: redirectUrl,
          session_token: input.correlationId,
        },
        (error, payload) => {
          if (error) {
            reject(error);
            return;
          }

          if (!payload) {
            reject(new Error('SetupGoCardlessMandate returned an empty response'));
            return;
          }

          resolve(payload);
        },
      );
    });

    return {
      mandateId: response.mandate_id,
    };
  }

  async createRecurringSubscription(input: {
    societeId: string;
    clientId: string;
    amountCents: number;
    currency: string;
    metadata: Record<string, string>;
  }): Promise<{ subscriptionId: string }> {
    const response = await new Promise<CreateSubscriptionResponse>(
      (resolve, reject) => {
        this.client.CreateGoCardlessSubscription(
          {
            societe_id: input.societeId,
            client_id: input.clientId,
            amount: input.amountCents,
            currency: input.currency,
            interval_unit: 'monthly',
            interval: 1,
            metadata: input.metadata,
          },
          (error, payload) => {
            if (error) {
              reject(error);
              return;
            }

            if (!payload) {
              reject(
                new Error('CreateGoCardlessSubscription returned an empty response'),
              );
              return;
            }

            resolve(payload);
          },
        );
      },
    );

    return {
      subscriptionId: response.subscription_id,
    };
  }

  async pauseOrCancelSubscription(input: {
    societeId: string;
    subscriptionId: string;
  }): Promise<{ status: string }> {
    const response = await new Promise<CancelSubscriptionResponse>(
      (resolve, reject) => {
        this.client.CancelGoCardlessSubscription(
          {
            societe_id: input.societeId,
            subscription_id: input.subscriptionId,
          },
          (error, payload) => {
            if (error) {
              reject(error);
              return;
            }

            if (!payload) {
              reject(
                new Error('CancelGoCardlessSubscription returned an empty response'),
              );
              return;
            }

            resolve(payload);
          },
        );
      },
    );

    return {
      status: response.status || 'cancelled',
    };
  }
}
