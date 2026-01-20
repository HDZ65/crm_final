import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface MicrosoftTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  idToken?: string;
}

export interface MicrosoftUserInfo {
  email: string;
  name: string;
  picture?: string;
  locale?: string;
}

@Injectable()
export class MicrosoftOAuthService {
  private readonly logger = new Logger(MicrosoftOAuthService.name);
  private readonly httpClient: AxiosInstance;

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  private readonly AUTHORITY = 'https://login.microsoftonline.com/common';
  private readonly GRAPH_API_URL = 'https://graph.microsoft.com/v1.0';

  private readonly SCOPES = [
    'https://graph.microsoft.com/Mail.Send',
    'https://graph.microsoft.com/Mail.Read',
    'https://graph.microsoft.com/User.Read',
    'offline_access',
    'openid',
    'profile',
    'email',
  ];

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('MICROSOFT_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('MICROSOFT_CLIENT_SECRET') || '';
    this.redirectUri = this.configService.get<string>('MICROSOFT_REDIRECT_URI') || '';

    this.httpClient = axios.create({
      timeout: 30000,
    });
  }

  /**
   * Generate the Microsoft OAuth2 authorization URL
   */
  getAuthorizationUrl(
    redirectUri?: string,
    state?: string,
    scopes?: string[],
  ): { authorizationUrl: string; state: string } {
    const generatedState = state || this.generateState();
    const effectiveScopes = scopes?.length ? scopes : this.SCOPES;
    const effectiveRedirectUri = redirectUri || this.redirectUri;

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: effectiveRedirectUri,
      response_mode: 'query',
      scope: effectiveScopes.join(' '),
      state: generatedState,
      prompt: 'consent',
    });

    const authorizationUrl = `${this.AUTHORITY}/oauth2/v2.0/authorize?${params.toString()}`;

    return { authorizationUrl, state: generatedState };
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(
    code: string,
    redirectUri?: string,
  ): Promise<MicrosoftTokens> {
    try {
      const effectiveRedirectUri = redirectUri || this.redirectUri;

      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: effectiveRedirectUri,
        grant_type: 'authorization_code',
        scope: this.SCOPES.join(' '),
      });

      const response = await this.httpClient.post(
        `${this.AUTHORITY}/oauth2/v2.0/token`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type,
        idToken: response.data.id_token,
      };
    } catch (error) {
      this.logger.error('Failed to exchange Microsoft authorization code', error);
      throw new Error(`Failed to exchange authorization code: ${error.message}`);
    }
  }

  /**
   * Refresh an access token using the refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<MicrosoftTokens> {
    try {
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: this.SCOPES.join(' '),
      });

      const response = await this.httpClient.post(
        `${this.AUTHORITY}/oauth2/v2.0/token`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || refreshToken,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type,
        idToken: response.data.id_token,
      };
    } catch (error) {
      this.logger.error('Failed to refresh Microsoft access token', error);
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }
  }

  /**
   * Get user info from Microsoft Graph API
   */
  async getUserInfo(accessToken: string): Promise<MicrosoftUserInfo> {
    try {
      const response = await this.httpClient.get(`${this.GRAPH_API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return {
        email: response.data.mail || response.data.userPrincipalName || '',
        name: response.data.displayName || '',
        locale: response.data.preferredLanguage,
      };
    } catch (error) {
      this.logger.error('Failed to get Microsoft user info', error);
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }

  /**
   * Send email using Microsoft Graph API
   */
  async sendEmail(
    accessToken: string,
    options: {
      to: string[];
      cc?: string[];
      bcc?: string[];
      subject: string;
      textBody?: string;
      htmlBody?: string;
      attachments?: Array<{
        filename: string;
        contentType: string;
        content: Buffer;
        contentId?: string;
      }>;
      replyTo?: string;
    },
  ): Promise<{ messageId: string }> {
    try {
      const toRecipients = options.to.map((email) => ({
        emailAddress: { address: email },
      }));

      const ccRecipients = options.cc?.map((email) => ({
        emailAddress: { address: email },
      }));

      const bccRecipients = options.bcc?.map((email) => ({
        emailAddress: { address: email },
      }));

      const attachments = options.attachments?.map((att) => ({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: att.filename,
        contentType: att.contentType,
        contentBytes: att.content.toString('base64'),
        contentId: att.contentId,
      }));

      const messagePayload: any = {
        message: {
          subject: options.subject,
          body: {
            contentType: options.htmlBody ? 'HTML' : 'Text',
            content: options.htmlBody || options.textBody || '',
          },
          toRecipients,
          ccRecipients,
          bccRecipients,
          attachments,
        },
        saveToSentItems: true,
      };

      if (options.replyTo) {
        messagePayload.message.replyTo = [
          { emailAddress: { address: options.replyTo } },
        ];
      }

      const response = await this.httpClient.post(
        `${this.GRAPH_API_URL}/me/sendMail`,
        messagePayload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // Microsoft doesn't return a message ID for sendMail, generate one
      return { messageId: `ms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
    } catch (error) {
      this.logger.error('Failed to send email via Microsoft Graph', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Get emails from Microsoft Graph API
   */
  async getEmails(
    accessToken: string,
    options: {
      folder?: string;
      limit?: number;
      skip?: number;
      filter?: string;
    },
  ): Promise<{
    emails: Array<{
      id: string;
      subject: string;
      from: { email: string; name?: string };
      receivedAt: string;
      isRead: boolean;
    }>;
    total: number;
  }> {
    try {
      const folder = options.folder || 'inbox';
      const top = options.limit || 20;
      const skip = options.skip || 0;

      let url = `${this.GRAPH_API_URL}/me/mailFolders/${folder}/messages?$top=${top}&$skip=${skip}&$orderby=receivedDateTime desc`;

      if (options.filter) {
        url += `&$filter=${encodeURIComponent(options.filter)}`;
      }

      const response = await this.httpClient.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const emails = response.data.value.map((msg: any) => ({
        id: msg.id,
        subject: msg.subject,
        from: {
          email: msg.from?.emailAddress?.address || '',
          name: msg.from?.emailAddress?.name,
        },
        receivedAt: msg.receivedDateTime,
        isRead: msg.isRead,
      }));

      return {
        emails,
        total: response.data['@odata.count'] || emails.length,
      };
    } catch (error) {
      this.logger.error('Failed to get emails from Microsoft Graph', error);
      throw new Error(`Failed to get emails: ${error.message}`);
    }
  }

  /**
   * Get a single email from Microsoft Graph API
   */
  async getEmail(
    accessToken: string,
    emailId: string,
  ): Promise<{
    id: string;
    subject: string;
    from: { email: string; name?: string };
    to: Array<{ email: string; name?: string }>;
    cc: Array<{ email: string; name?: string }>;
    textBody?: string;
    htmlBody?: string;
    receivedAt: string;
    isRead: boolean;
  }> {
    try {
      const response = await this.httpClient.get(
        `${this.GRAPH_API_URL}/me/messages/${emailId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const msg = response.data;

      return {
        id: msg.id,
        subject: msg.subject,
        from: {
          email: msg.from?.emailAddress?.address || '',
          name: msg.from?.emailAddress?.name,
        },
        to: msg.toRecipients?.map((r: any) => ({
          email: r.emailAddress?.address || '',
          name: r.emailAddress?.name,
        })) || [],
        cc: msg.ccRecipients?.map((r: any) => ({
          email: r.emailAddress?.address || '',
          name: r.emailAddress?.name,
        })) || [],
        textBody: msg.body?.contentType === 'text' ? msg.body?.content : undefined,
        htmlBody: msg.body?.contentType === 'html' ? msg.body?.content : undefined,
        receivedAt: msg.receivedDateTime,
        isRead: msg.isRead,
      };
    } catch (error) {
      this.logger.error('Failed to get email from Microsoft Graph', error);
      throw new Error(`Failed to get email: ${error.message}`);
    }
  }

  private generateState(): string {
    return Buffer.from(
      JSON.stringify({
        timestamp: Date.now(),
        random: Math.random().toString(36).substring(2),
      }),
    ).toString('base64');
  }
}
