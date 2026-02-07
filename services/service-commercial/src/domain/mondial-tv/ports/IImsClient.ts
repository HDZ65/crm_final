export const IMS_CLIENT = 'IMS_CLIENT';

export interface ImsClientCallResult<T = Record<string, any>> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export interface ImsCreateUserInput {
  email: string;
  firstName?: string;
  lastName?: string;
  organisationId?: string;
  metadata?: Record<string, any>;
}

export interface IImsClient {
  notifySuspension(
    imsSubscriptionId: string,
    reason: string,
  ): Promise<ImsClientCallResult<{ imsSubscriptionId: string; status: 'SUSPENDED'; reason: string }>>;
  notifyReactivation(
    imsSubscriptionId: string,
  ): Promise<ImsClientCallResult<{ imsSubscriptionId: string; status: 'ACTIVE' }>>;
  notifyCancellation(
    imsSubscriptionId: string,
    reason: string,
  ): Promise<ImsClientCallResult<{ imsSubscriptionId: string; status: 'CANCELLED'; reason: string }>>;
  createUser(
    userData: ImsCreateUserInput,
  ): Promise<ImsClientCallResult<{ imsUserId: string; status: 'CREATED'; user: ImsCreateUserInput }>>;
  updateSubscription(
    imsSubscriptionId: string,
    changes: Record<string, any>,
  ): Promise<
    ImsClientCallResult<{
      imsSubscriptionId: string;
      status: 'UPDATED';
      changes: Record<string, any>;
    }>
  >;
}
