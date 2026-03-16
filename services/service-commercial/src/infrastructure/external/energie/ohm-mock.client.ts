import { Injectable, Logger } from '@nestjs/common';
import type { EnergiePartenairePort } from '../../../domain/energie/ports/energie-partenaire.port';

type MockCallRecord = {
  method: string;
  payload: Record<string, unknown>;
  calledAt: string;
};

@Injectable()
export class OhmMockClient implements EnergiePartenairePort {
  private readonly logger = new Logger(OhmMockClient.name);
  private readonly calls: MockCallRecord[] = [];

  async createRaccordement(data: {
    clientId: string;
    contratId: string;
    adresse?: string;
    pdlPce?: string;
  }): Promise<{ raccordementId: string }> {
    const raccordementId = `ohm-${data.clientId}`;
    this.recordCall('createRaccordement', { ...data });
    return { raccordementId };
  }

  async getStatus(raccordementId: string): Promise<{ status: string }> {
    this.recordCall('getStatus', { raccordementId });
    return { status: 'ACTIVE' };
  }

  async activateSupply(raccordementId: string): Promise<void> {
    this.recordCall('activateSupply', { raccordementId });
  }

  async suspendSupply(raccordementId: string): Promise<void> {
    this.recordCall('suspendSupply', { raccordementId });
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
      `[MOCK OHM] ${method} called at ${calledAt} with payload ${JSON.stringify(payload)}`,
    );
  }
}
