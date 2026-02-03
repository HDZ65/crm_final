import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { MicrosoftOAuthService } from './microsoft-oauth.service';
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
export class MicrosoftOAuthController {
  private readonly logger = new Logger(MicrosoftOAuthController.name);

  constructor(
    private readonly microsoftOAuthService: MicrosoftOAuthService,
    private readonly mailboxService: MailboxService,
  ) {}

  @GrpcMethod('EmailService', 'GetMicrosoftAuthUrl')
  async getMicrosoftAuthUrl(request: GetAuthUrlRequest): Promise<AuthUrlResponse> {
    try {
      const result = this.microsoftOAuthService.getAuthorizationUrl(
        request.redirectUri,
        request.state,
        request.scopes,
      );
      return {
        authorizationUrl: result.authorizationUrl,
        state: result.state,
      };
    } catch (e: any) {
      this.logger.error('GetMicrosoftAuthUrl failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('EmailService', 'ExchangeMicrosoftCode')
  async exchangeMicrosoftCode(request: ExchangeCodeRequest): Promise<TokenResponse> {
    try {
      const tokens = await this.microsoftOAuthService.getTokensFromCode(
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
      this.logger.error('ExchangeMicrosoftCode failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('EmailService', 'RefreshMicrosoftToken')
  async refreshMicrosoftToken(request: RefreshTokenRequest): Promise<TokenResponse> {
    try {
      const { refreshToken } = await this.mailboxService.getDecryptedTokens(request.mailboxId);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const tokens = await this.microsoftOAuthService.refreshAccessToken(refreshToken);

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
      this.logger.error('RefreshMicrosoftToken failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('EmailService', 'RevokeMicrosoftToken')
  async revokeMicrosoftToken(request: RevokeTokenRequest): Promise<DeleteResponse> {
    try {
      if (request.mailboxId) {
        await this.mailboxService.update(request.mailboxId, {
          accessToken: undefined,
          refreshToken: undefined,
          tokenExpiry: undefined,
        });
      }

      return { success: true, message: 'Token cleared successfully' };
    } catch (e: any) {
      this.logger.error('RevokeMicrosoftToken failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }

  @GrpcMethod('EmailService', 'GetMicrosoftUserInfo')
  async getMicrosoftUserInfo(request: GetUserInfoRequest): Promise<UserInfoResponse> {
    try {
      const userInfo = await this.microsoftOAuthService.getUserInfo(request.accessToken);
      return userInfo as any;
    } catch (e: any) {
      this.logger.error('GetMicrosoftUserInfo failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e.message });
    }
  }
}
