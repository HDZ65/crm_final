import { Injectable, Logger } from '@nestjs/common';
import {
  IImsClient,
  type ImsClientCallResult,
  type ImsCreateUserInput,
} from '../../../domain/mondial-tv/ports/IImsClient';

type MockCallRecord = {
  method: string;
  payload: Record<string, any>;
  calledAt: string;
};

@Injectable()
export class MockImsClient implements IImsClient {
  private readonly logger = new Logger(MockImsClient.name);
  private readonly calls: MockCallRecord[] = [];
  private userCounter = 0;

  async notifySuspension(
    imsSubscriptionId: string,
    reason: string,
  ): Promise<ImsClientCallResult<{ imsSubscriptionId: string; status: 'SUSPENDED'; reason: string }>> {
    return this.recordCall('notifySuspension', { imsSubscriptionId, reason }, {
      imsSubscriptionId,
      status: 'SUSPENDED',
      reason,
    });
  }

  async notifyReactivation(
    imsSubscriptionId: string,
  ): Promise<ImsClientCallResult<{ imsSubscriptionId: string; status: 'ACTIVE' }>> {
    return this.recordCall('notifyReactivation', { imsSubscriptionId }, {
      imsSubscriptionId,
      status: 'ACTIVE',
    });
  }

  async notifyCancellation(
    imsSubscriptionId: string,
    reason: string,
  ): Promise<ImsClientCallResult<{ imsSubscriptionId: string; status: 'CANCELLED'; reason: string }>> {
    return this.recordCall('notifyCancellation', { imsSubscriptionId, reason }, {
      imsSubscriptionId,
      status: 'CANCELLED',
      reason,
    });
  }

  async createUser(
    userData: ImsCreateUserInput,
  ): Promise<ImsClientCallResult<{ imsUserId: string; status: 'CREATED'; user: ImsCreateUserInput }>> {
    this.userCounter += 1;
    const imsUserId = `mock-ims-user-${this.userCounter}`;

    return this.recordCall('createUser', { userData }, {
      imsUserId,
      status: 'CREATED',
      user: userData,
    });
  }

  async updateSubscription(
    imsSubscriptionId: string,
    changes: Record<string, any>,
  ): Promise<
    ImsClientCallResult<{
      imsSubscriptionId: string;
      status: 'UPDATED';
      changes: Record<string, any>;
    }>
  > {
    return this.recordCall('updateSubscription', { imsSubscriptionId, changes }, {
      imsSubscriptionId,
      status: 'UPDATED',
      changes,
    });
  }

  getCallHistory(): MockCallRecord[] {
    return [...this.calls];
  }

  clearCallHistory(): void {
    this.calls.length = 0;
  }

  private recordCall<T>(
    method: string,
    payload: Record<string, any>,
    data: T,
  ): ImsClientCallResult<T> {
    const calledAt = new Date().toISOString();
    this.calls.push({ method, payload, calledAt });

    this.logger.log(
      `[MOCK IMS] ${method} called at ${calledAt} with payload ${JSON.stringify(payload)}`,
    );

    return {
      success: true,
      statusCode: 200,
      message: `Mock IMS call executed: ${method}`,
      data,
    };
  }
}
