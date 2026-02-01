import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { GoogleOAuthService } from './google-oauth.service';
import { MailboxService } from '../../mailbox/mailbox.service';
import type {
  GetAuthUrlRequest,
  AuthUrlResponse,
  ExchangeCodeRequest,
  TokenResponse,
  RefreshTokenRequest,
  RevokeTokenRequest,
  GetUserInfoRequest,
  UserInfoResponse,
  DeleteResponse,
} from '@crm/proto/email';

@Controller()
export class GoogleOAuthController {
  private readonly logger = new Logger(GoogleOAuthController.name);

  constructor(
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly mailboxService: MailboxService,
  ) {}

  @GrpcMethod('EmailService', 'GetGoogleAuthUrl')
  async getGoogleAuthUrl(request: GetAuthUrlRequest): Promise<AuthUrlResponse> {
    try {
      const result = this.googleOAuthService.getAuthorizationUrl(
        request.redirectUri,
        request.state,
        request.scopes,
      );
      return {
        authorizationUrl: result.authorizationUrl,
        state: result.state,
      };
    } catch (e: any) {
      this.logger.error('GetGoogleAuthUrl failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('EmailService', 'ExchangeGoogleCode')
  async exchangeGoogleCode(request: ExchangeCodeRequest): Promise<TokenResponse> {
    try {
      const tokens = await this.googleOAuthService.getTokensFromCode(
        request.code,
        request.redirectUri,
      );
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        tokenType: tokens.tokenType,
        idToken: tokens.idToken,
      };
    } catch (e: any) {
      this.logger.error('ExchangeGoogleCode failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('EmailService', 'RefreshGoogleToken')
  async refreshGoogleToken(request: RefreshTokenRequest): Promise<TokenResponse> {
    try {
      const { refreshToken } = await this.mailboxService.getDecryptedTokens(request.mailboxId);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const tokens = await this.googleOAuthService.refreshAccessToken(refreshToken);

      await this.mailboxService.updateTokens(
        request.mailboxId,
        tokens.accessToken,
        tokens.refreshToken,
        new Date(Date.now() + tokens.expiresIn * 1000),
      );

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        tokenType: tokens.tokenType,
      };
    } catch (e: any) {
      this.logger.error('RefreshGoogleToken failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('EmailService', 'RevokeGoogleToken')
  async revokeGoogleToken(request: RevokeTokenRequest): Promise<DeleteResponse> {
    try {
      await this.googleOAuthService.revokeToken(request.accessToken);

      if (request.mailboxId) {
        await this.mailboxService.update(request.mailboxId, {
          accessToken: undefined,
          refreshToken: undefined,
          tokenExpiry: undefined,
        });
      }

      return { success: true, message: 'Token revoked successfully' };
    } catch (e: any) {
      this.logger.error('RevokeGoogleToken failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('EmailService', 'GetGoogleUserInfo')
  async getGoogleUserInfo(request: GetUserInfoRequest): Promise<UserInfoResponse> {
    try {
      const userInfo = await this.googleOAuthService.getUserInfo(request.accessToken);
      return userInfo as any;
    } catch (e: any) {
      this.logger.error('GetGoogleUserInfo failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }
}
