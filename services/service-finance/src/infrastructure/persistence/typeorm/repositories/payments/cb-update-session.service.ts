import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';

export interface CreateCbUpdateSessionInput {
  clientId: string;
  organisationId: string;
  scheduleId: string;
  subscriptionType: 'WEB_DIRECT' | 'STORE';
}

export interface CbUpdateSession {
  token: string;
  tokenHash: string;
  link: string;
  expiresAt: Date;
  clientId: string;
  organisationId: string;
  scheduleId: string;
}

/**
 * CB (Card/Carte Bancaire) Update Session Service.
 *
 * Generates temporary 24h tokens for SMS J+2 links.
 * Subscribers can click the link to update their payment method.
 * Only available for WEB_DIRECT subscriptions (not store).
 */
@Injectable()
export class CbUpdateSessionService {
  private readonly logger = new Logger(CbUpdateSessionService.name);
  private readonly portalBaseUrl: string;

  /** In-memory store for sessions (replace with DB persistence in production) */
  private readonly sessions = new Map<string, CbUpdateSession>();

  constructor(private readonly configService: ConfigService) {
    this.portalBaseUrl = this.configService.get<string>(
      'PORTAL_BASE_URL',
      'https://portal.mondial-tv.fr',
    );
  }

  async createSession(
    input: CreateCbUpdateSessionInput,
  ): Promise<CbUpdateSession> {
    if (input.subscriptionType === 'STORE') {
      throw new Error(
        'CB update sessions are only available for WEB_DIRECT subscriptions',
      );
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const link = `${this.portalBaseUrl}/cb-update?token=${token}`;

    const session: CbUpdateSession = {
      token,
      tokenHash,
      link,
      expiresAt,
      clientId: input.clientId,
      organisationId: input.organisationId,
      scheduleId: input.scheduleId,
    };

    this.sessions.set(tokenHash, session);

    this.logger.log(
      `CB update session created: client=${input.clientId} expires=${expiresAt.toISOString()}`,
    );

    return session;
  }

  async validateToken(token: string): Promise<CbUpdateSession | null> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const session = this.sessions.get(tokenHash);

    if (!session) {
      return null;
    }

    if (session.expiresAt < new Date()) {
      this.sessions.delete(tokenHash);
      this.logger.debug(`CB update session expired: hash=${tokenHash.slice(0, 8)}...`);
      return null;
    }

    return session;
  }

  async revokeSession(tokenHash: string): Promise<boolean> {
    return this.sessions.delete(tokenHash);
  }

  /** Get count of active (non-expired) sessions */
  getActiveSessionCount(): number {
    const now = new Date();
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.expiresAt >= now) {
        count++;
      }
    }
    return count;
  }
}
