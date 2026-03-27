import { Injectable, Logger } from '@nestjs/common';
import type { ReducBoxPort } from '../../../domain/reducbox/ports/reducbox.port';

type MockCallRecord = {
  method: string;
  payload: Record<string, unknown>;
  calledAt: string;
};

@Injectable()
export class ReducBoxMockClient implements ReducBoxPort {
  private readonly logger = new Logger(ReducBoxMockClient.name);
  private readonly calls: MockCallRecord[] = [];
  private accessCounter = 0;

  async createAccess(
    clientId: string,
    contratId: string,
  ): Promise<{ externalAccessId: string }> {
    this.accessCounter += 1;
    const externalAccessId = `reducbox-${clientId}-${this.accessCounter}`;

    this.recordCall('createAccess', { clientId, contratId });

    return { externalAccessId };
  }

  async suspendAccess(externalAccessId: string, reason: string): Promise<void> {
    this.recordCall('suspendAccess', { externalAccessId, reason });
  }

  async restoreAccess(externalAccessId: string): Promise<void> {
    this.recordCall('restoreAccess', { externalAccessId });
  }

  async cancelAccess(externalAccessId: string): Promise<void> {
    this.recordCall('cancelAccess', { externalAccessId });
  }

  getCallHistory(): MockCallRecord[] {
    return [...this.calls];
  }

  clearCallHistory(): void {
    this.calls.length = 0;
  }

  private recordCall(method: string, payload: Record<string, unknown>): void {
    const calledAt = new Date().toISOString();
    this.calls.push({ method, payload, calledAt });

    this.logger.log(
      `[MOCK REDUCBOX] ${method} called at ${calledAt} with payload ${JSON.stringify(payload)}`,
    );
  }
}
