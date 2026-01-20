import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { MailboxService } from './modules/mailbox/mailbox.service';
import { GoogleOAuthService } from './modules/oauth/google/google-oauth.service';
import { MicrosoftOAuthService } from './modules/oauth/microsoft/microsoft-oauth.service';
import {
  MailProvider as EntityMailProvider,
  ConnectionType as EntityConnectionType,
} from './modules/mailbox/entities/mailbox.entity';
import { status } from '@grpc/grpc-js';
import type {
  MailProvider,
  ConnectionType,
  Mailbox,
  CreateMailboxRequest,
  GetMailboxRequest,
  GetMailboxesByOrganisationRequest,
  GetMailboxesBySocieteRequest,
  UpdateMailboxRequest,
  DeleteMailboxRequest,
  MailboxResponse,
  MailboxListResponse,
  DeleteResponse,
  GetAuthUrlRequest,
  AuthUrlResponse,
  ExchangeCodeRequest,
  TokenResponse,
  RefreshTokenRequest,
  RevokeTokenRequest,
  GetUserInfoRequest,
  UserInfoResponse,
  SendEmailRequest,
  SendEmailResponse,
  GetEmailsRequest,
  GetEmailRequest,
  EmailResponse,
  EmailListResponse,
  TestConnectionRequest,
  TestConnectionResponse,
} from '@proto/email/email';

// ============================================
// Helper Functions
// ============================================

function toGrpcMailProvider(provider: EntityMailProvider): MailProvider {
  const mapping: Record<EntityMailProvider, MailProvider> = {
    [EntityMailProvider.GMAIL]: 1,
    [EntityMailProvider.OUTLOOK]: 2,
    [EntityMailProvider.EXCHANGE]: 3,
    [EntityMailProvider.SMTP]: 4,
    [EntityMailProvider.OTHER]: 5,
  };
  return mapping[provider] || 0;
}

function fromGrpcMailProvider(value: MailProvider): EntityMailProvider {
  const mapping: Record<number, EntityMailProvider> = {
    1: EntityMailProvider.GMAIL,
    2: EntityMailProvider.OUTLOOK,
    3: EntityMailProvider.EXCHANGE,
    4: EntityMailProvider.SMTP,
    5: EntityMailProvider.OTHER,
  };
  return mapping[value] || EntityMailProvider.SMTP;
}

function toGrpcConnectionType(type: EntityConnectionType): ConnectionType {
  return type === EntityConnectionType.OAUTH2 ? 1 : 2;
}

function fromGrpcConnectionType(value: ConnectionType): EntityConnectionType {
  return value === 1 ? EntityConnectionType.OAUTH2 : EntityConnectionType.SMTP_IMAP;
}

@Controller()
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(
    private readonly mailboxService: MailboxService,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly microsoftOAuthService: MicrosoftOAuthService,
  ) {}

  // ============================================
  // MAILBOX MANAGEMENT
  // ============================================

  @GrpcMethod('EmailService', 'CreateMailbox')
  async createMailbox(request: CreateMailboxRequest): Promise<MailboxResponse> {
    try {
      const mailbox = await this.mailboxService.create({
        organisationId: request.organisationId,
        societeId: request.societeId,
        userId: request.userId,
        nom: request.nom,
        adresseEmail: request.adresseEmail,
        fournisseur: fromGrpcMailProvider(request.fournisseur),
        typeConnexion: fromGrpcConnectionType(request.typeConnexion),
        smtpHost: request.smtpHost,
        smtpPort: request.smtpPort,
        imapHost: request.imapHost,
        imapPort: request.imapPort,
        username: request.username,
        password: request.password,
        accessToken: request.accessToken,
        refreshToken: request.refreshToken,
        tokenExpiry: request.tokenExpiry ? new Date(request.tokenExpiry) : undefined,
        signature: request.signature,
        isDefault: request.isDefault || false,
      });

      return { mailbox: this.toGrpcMailbox(mailbox) };
    } catch (error) {
      this.logger.error('CreateMailbox failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: (error as Error).message,
      });
    }
  }

  @GrpcMethod('EmailService', 'GetMailbox')
  async getMailbox(request: GetMailboxRequest): Promise<MailboxResponse> {
    try {
      const mailbox = await this.mailboxService.findById(request.id);
      return { mailbox: this.toGrpcMailbox(mailbox) };
    } catch (error) {
      this.logger.error('GetMailbox failed', error);
      const err = error as Error & { status?: number };
      throw new RpcException({
        code: err.status === 404 ? status.NOT_FOUND : status.INTERNAL,
        message: err.message,
      });
    }
  }

  @GrpcMethod('EmailService', 'GetMailboxesByOrganisation')
  async getMailboxesByOrganisation(request: GetMailboxesByOrganisationRequest): Promise<MailboxListResponse> {
    try {
      const result = await this.mailboxService.findByOrganisation(
        request.organisationId,
        request.limit,
        request.offset,
      );

      return {
        mailboxes: result.mailboxes.map((m) => this.toGrpcMailbox(m)),
        total: result.total,
      };
    } catch (error) {
      this.logger.error('GetMailboxesByOrganisation failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: (error as Error).message,
      });
    }
  }

  @GrpcMethod('EmailService', 'GetMailboxesBySociete')
  async getMailboxesBySociete(request: GetMailboxesBySocieteRequest): Promise<MailboxListResponse> {
    try {
      const result = await this.mailboxService.findBySociete(
        request.societeId,
        request.limit,
        request.offset,
      );

      return {
        mailboxes: result.mailboxes.map((m) => this.toGrpcMailbox(m)),
        total: result.total,
      };
    } catch (error) {
      this.logger.error('GetMailboxesBySociete failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: (error as Error).message,
      });
    }
  }

  @GrpcMethod('EmailService', 'UpdateMailbox')
  async updateMailbox(request: UpdateMailboxRequest): Promise<MailboxResponse> {
    try {
      const mailbox = await this.mailboxService.update(request.id, {
        nom: request.nom,
        adresseEmail: request.adresseEmail,
        fournisseur: request.fournisseur !== undefined ? fromGrpcMailProvider(request.fournisseur) : undefined,
        typeConnexion: request.typeConnexion !== undefined ? fromGrpcConnectionType(request.typeConnexion) : undefined,
        smtpHost: request.smtpHost,
        smtpPort: request.smtpPort,
        imapHost: request.imapHost,
        imapPort: request.imapPort,
        username: request.username,
        password: request.password,
        accessToken: request.accessToken,
        refreshToken: request.refreshToken,
        tokenExpiry: request.tokenExpiry ? new Date(request.tokenExpiry) : undefined,
        signature: request.signature,
        isDefault: request.isDefault,
        isActive: request.isActive,
      });

      return { mailbox: this.toGrpcMailbox(mailbox) };
    } catch (error) {
      this.logger.error('UpdateMailbox failed', error);
      const err = error as Error & { status?: number };
      throw new RpcException({
        code: err.status === 404 ? status.NOT_FOUND : status.INTERNAL,
        message: err.message,
      });
    }
  }

  @GrpcMethod('EmailService', 'DeleteMailbox')
  async deleteMailbox(request: DeleteMailboxRequest): Promise<DeleteResponse> {
    try {
      await this.mailboxService.delete(request.id);
      return { success: true, message: 'Mailbox deleted successfully' };
    } catch (error) {
      this.logger.error('DeleteMailbox failed', error);
      const err = error as Error & { status?: number };
      throw new RpcException({
        code: err.status === 404 ? status.NOT_FOUND : status.INTERNAL,
        message: err.message,
      });
    }
  }

  // ============================================
  // GOOGLE OAUTH2
  // ============================================

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
    } catch (error) {
      this.logger.error('GetGoogleAuthUrl failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: (error as Error).message,
      });
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
    } catch (error) {
      this.logger.error('ExchangeGoogleCode failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: (error as Error).message,
      });
    }
  }

  @GrpcMethod('EmailService', 'RefreshGoogleToken')
  async refreshGoogleToken(request: RefreshTokenRequest): Promise<TokenResponse> {
    try {
      // Get the refresh token from the mailbox
      const { refreshToken } = await this.mailboxService.getDecryptedTokens(
        request.mailboxId,
      );

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const tokens = await this.googleOAuthService.refreshAccessToken(refreshToken);

      // Update the mailbox with new tokens
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
    } catch (error) {
      this.logger.error('RefreshGoogleToken failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: (error as Error).message,
      });
    }
  }

  @GrpcMethod('EmailService', 'RevokeGoogleToken')
  async revokeGoogleToken(request: RevokeTokenRequest): Promise<DeleteResponse> {
    try {
      await this.googleOAuthService.revokeToken(request.accessToken);

      // Clear tokens from mailbox if mailboxId provided
      if (request.mailboxId) {
        await this.mailboxService.update(request.mailboxId, {
          accessToken: undefined,
          refreshToken: undefined,
          tokenExpiry: undefined,
        });
      }

      return { success: true, message: 'Token revoked successfully' };
    } catch (error) {
      this.logger.error('RevokeGoogleToken failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: (error as Error).message,
      });
    }
  }

  @GrpcMethod('EmailService', 'GetGoogleUserInfo')
  async getGoogleUserInfo(request: GetUserInfoRequest): Promise<UserInfoResponse> {
    try {
      const userInfo = await this.googleOAuthService.getUserInfo(request.accessToken);
      return userInfo;
    } catch (error) {
      this.logger.error('GetGoogleUserInfo failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: (error as Error).message,
      });
    }
  }

  // ============================================
  // MICROSOFT OAUTH2
  // ============================================

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
    } catch (error) {
      this.logger.error('GetMicrosoftAuthUrl failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: (error as Error).message,
      });
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
    } catch (error) {
      this.logger.error('ExchangeMicrosoftCode failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: (error as Error).message,
      });
    }
  }

  @GrpcMethod('EmailService', 'RefreshMicrosoftToken')
  async refreshMicrosoftToken(request: RefreshTokenRequest): Promise<TokenResponse> {
    try {
      const { refreshToken } = await this.mailboxService.getDecryptedTokens(
        request.mailboxId,
      );

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
    } catch (error) {
      this.logger.error('RefreshMicrosoftToken failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: (error as Error).message,
      });
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
    } catch (error) {
      this.logger.error('RevokeMicrosoftToken failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: (error as Error).message,
      });
    }
  }

  @GrpcMethod('EmailService', 'GetMicrosoftUserInfo')
  async getMicrosoftUserInfo(request: GetUserInfoRequest): Promise<UserInfoResponse> {
    try {
      const userInfo = await this.microsoftOAuthService.getUserInfo(request.accessToken);
      return userInfo;
    } catch (error) {
      this.logger.error('GetMicrosoftUserInfo failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: (error as Error).message,
      });
    }
  }

  // ============================================
  // EMAIL OPERATIONS
  // ============================================

  @GrpcMethod('EmailService', 'SendEmail')
  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    try {
      const mailbox = await this.mailboxService.findById(request.mailboxId);
      const { accessToken, refreshToken } = await this.mailboxService.getDecryptedTokens(
        request.mailboxId,
      );

      const emailOptions = {
        to: request.to.map((r) => r.email),
        cc: request.cc?.map((r) => r.email),
        bcc: request.bcc?.map((r) => r.email),
        subject: request.subject,
        textBody: request.textBody,
        htmlBody: request.htmlBody,
        attachments: request.attachments?.map((a) => ({
          filename: a.filename,
          contentType: a.contentType,
          content: Buffer.from(a.content),
          contentId: a.contentId,
        })),
        replyTo: request.replyTo,
      };

      let result: { messageId: string };

      if (mailbox.fournisseur === EntityMailProvider.GMAIL) {
        result = await this.googleOAuthService.sendEmail(
          accessToken,
          refreshToken || '',
          emailOptions,
        );
      } else if (
        mailbox.fournisseur === EntityMailProvider.OUTLOOK ||
        mailbox.fournisseur === EntityMailProvider.EXCHANGE
      ) {
        result = await this.microsoftOAuthService.sendEmail(accessToken, emailOptions);
      } else {
        throw new Error('SMTP sending not implemented yet');
      }

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      this.logger.error('SendEmail failed', error);
      return {
        success: false,
        messageId: '',
        error: (error as Error).message,
      };
    }
  }

  @GrpcMethod('EmailService', 'GetEmails')
  async getEmails(request: GetEmailsRequest): Promise<EmailListResponse> {
    try {
      const mailbox = await this.mailboxService.findById(request.mailboxId);
      const { accessToken, refreshToken } = await this.mailboxService.getDecryptedTokens(
        request.mailboxId,
      );

      if (mailbox.fournisseur === EntityMailProvider.GMAIL) {
        const result = await this.googleOAuthService.getEmails(
          accessToken,
          refreshToken || '',
          {
            folder: request.folder,
            limit: request.limit,
            query: request.searchQuery,
          },
        );

        return {
          emails: result.emails.map((e) => ({
            id: e.id,
            mailboxId: request.mailboxId,
            messageId: e.id,
            subject: '',
            folder: request.folder || 'INBOX',
            to: [],
            cc: [],
            attachments: [],
            isRead: false,
            isStarred: false,
            receivedAt: '',
          })),
          total: result.emails.length,
        };
      } else if (
        mailbox.fournisseur === EntityMailProvider.OUTLOOK ||
        mailbox.fournisseur === EntityMailProvider.EXCHANGE
      ) {
        const result = await this.microsoftOAuthService.getEmails(accessToken, {
          folder: request.folder,
          limit: request.limit,
          skip: request.offset,
        });

        return {
          emails: result.emails.map((e) => ({
            id: e.id,
            mailboxId: request.mailboxId,
            messageId: e.id,
            subject: e.subject,
            from: e.from ? { email: String(e.from) } : undefined,
            folder: request.folder || 'inbox',
            to: [],
            cc: [],
            attachments: [],
            isRead: e.isRead,
            isStarred: false,
            receivedAt: e.receivedAt,
          })),
          total: result.total,
        };
      }

      throw new Error('Provider not supported');
    } catch (error) {
      this.logger.error('GetEmails failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: (error as Error).message,
      });
    }
  }

  @GrpcMethod('EmailService', 'GetEmail')
  async getEmail(request: GetEmailRequest): Promise<EmailResponse> {
    try {
      const mailbox = await this.mailboxService.findById(request.mailboxId);
      const { accessToken, refreshToken } = await this.mailboxService.getDecryptedTokens(
        request.mailboxId,
      );

      if (mailbox.fournisseur === EntityMailProvider.GMAIL) {
        const email = await this.googleOAuthService.getEmail(
          accessToken,
          refreshToken || '',
          request.emailId,
        );

        return {
          email: {
            id: email.id,
            mailboxId: request.mailboxId,
            messageId: email.id,
            subject: email.subject,
            from: email.from ? { email: String(email.from) } : undefined,
            to: Array.isArray(email.to) ? email.to.map((e: unknown) => ({ email: String(e) })) : [],
            cc: [],
            textBody: email.textBody,
            htmlBody: email.htmlBody,
            attachments: [],
            folder: '',
            isRead: false,
            isStarred: false,
            receivedAt: email.receivedAt,
          },
        };
      } else if (
        mailbox.fournisseur === EntityMailProvider.OUTLOOK ||
        mailbox.fournisseur === EntityMailProvider.EXCHANGE
      ) {
        const email = await this.microsoftOAuthService.getEmail(
          accessToken,
          request.emailId,
        );

        return {
          email: {
            id: email.id,
            mailboxId: request.mailboxId,
            messageId: email.id,
            subject: email.subject,
            from: email.from ? { email: String(email.from) } : undefined,
            to: Array.isArray(email.to) ? email.to.map((e: unknown) => ({ email: String(e) })) : [],
            cc: Array.isArray(email.cc) ? email.cc.map((e: unknown) => ({ email: String(e) })) : [],
            textBody: email.textBody,
            htmlBody: email.htmlBody,
            attachments: [],
            folder: '',
            isRead: email.isRead,
            isStarred: false,
            receivedAt: email.receivedAt,
          },
        };
      }

      throw new Error('Provider not supported');
    } catch (error) {
      this.logger.error('GetEmail failed', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: (error as Error).message,
      });
    }
  }

  // ============================================
  // CONNECTION TEST
  // ============================================

  @GrpcMethod('EmailService', 'TestMailboxConnection')
  async testMailboxConnection(request: TestConnectionRequest): Promise<TestConnectionResponse> {
    try {
      const mailbox = await this.mailboxService.findById(request.mailboxId);

      if (mailbox.typeConnexion === EntityConnectionType.OAUTH2) {
        const { accessToken } = await this.mailboxService.getDecryptedTokens(
          request.mailboxId,
        );

        if (mailbox.fournisseur === EntityMailProvider.GMAIL) {
          await this.googleOAuthService.getUserInfo(accessToken);
        } else if (
          mailbox.fournisseur === EntityMailProvider.OUTLOOK ||
          mailbox.fournisseur === EntityMailProvider.EXCHANGE
        ) {
          await this.microsoftOAuthService.getUserInfo(accessToken);
        }

        await this.mailboxService.updateLastSync(request.mailboxId);

        return {
          success: true,
          message: 'Connection successful',
        };
      } else {
        return {
          success: false,
          message: 'SMTP/IMAP connection test not implemented',
        };
      }
    } catch (error) {
      this.logger.error('TestMailboxConnection failed', error);
      await this.mailboxService.setSyncError(request.mailboxId, (error as Error).message);

      return {
        success: false,
        message: 'Connection failed',
        errorDetails: (error as Error).message,
      };
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private toGrpcMailbox(mailbox: any): Mailbox {
    return {
      id: mailbox.id,
      organisationId: mailbox.organisationId,
      societeId: mailbox.societeId,
      userId: mailbox.userId,
      nom: mailbox.nom,
      adresseEmail: mailbox.adresseEmail,
      fournisseur: toGrpcMailProvider(mailbox.fournisseur),
      typeConnexion: toGrpcConnectionType(mailbox.typeConnexion),
      smtpHost: mailbox.smtpHost,
      smtpPort: mailbox.smtpPort,
      imapHost: mailbox.imapHost,
      imapPort: mailbox.imapPort,
      username: mailbox.username,
      signature: mailbox.signature,
      isDefault: mailbox.isDefault,
      isActive: mailbox.isActive,
      createdAt: mailbox.createdAt?.toISOString() ?? '',
      updatedAt: mailbox.updatedAt?.toISOString() ?? '',
    };
  }
}
