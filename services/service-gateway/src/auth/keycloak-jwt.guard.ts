import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

type JwtUser = Record<string, unknown>;
type RequestWithUser = Request & { user?: JwtUser };

@Injectable()
export class KeycloakJwtGuard implements CanActivate {
  private readonly logger = new Logger(KeycloakJwtGuard.name);
  private readonly jwksUrl: URL;
  private readonly issuerUrl: string;
  private readonly clientId: string;
  private jwks: unknown;
  private joseModulePromise?: Promise<any>;

  constructor(private readonly configService: ConfigService) {
    this.issuerUrl = this.configService.get<string>(
      'KEYCLOAK_ISSUER_URL',
      'http://localhost:8080/realms/master',
    );
    this.clientId = this.configService.get<string>(
      'KEYCLOAK_GATEWAY_CLIENT_ID',
      'winleadplus-api',
    );
    this.jwksUrl = new URL(`${this.issuerUrl}/protocol/openid-connect/certs`);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing or malformed Authorization header');
    }

    try {
      const jose = await this.getJoseModule();
      if (!this.jwks) {
        this.jwks = jose.createRemoteJWKSet(this.jwksUrl);
      }

      const { payload } = await jose.jwtVerify(token, this.jwks as never, {
        issuer: this.issuerUrl,
        audience: this.clientId,
      });

      request.user = payload;
      return true;
    } catch (error) {
      this.logger.warn(
        `JWT verification failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private getJoseModule(): Promise<any> {
    if (!this.joseModulePromise) {
      this.joseModulePromise = import('jose');
    }

    return this.joseModulePromise;
  }

  private extractBearerToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader || typeof authHeader !== 'string') {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return null;
    }

    return parts[1] || null;
  }
}
