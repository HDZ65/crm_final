import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, Credentials } from 'google-auth-library';
import { google } from 'googleapis';

export interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  idToken?: string;
}

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
  locale?: string;
}

@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);
  private readonly oauth2Client: OAuth2Client;

  private readonly SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  constructor(private readonly configService: ConfigService) {
    this.oauth2Client = new OAuth2Client({
      clientId: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      redirectUri: this.configService.get<string>('GOOGLE_REDIRECT_URI'),
    });
  }

  /**
   * Generate the Google OAuth2 authorization URL
   */
  getAuthorizationUrl(
    redirectUri?: string,
    state?: string,
    scopes?: string[],
  ): { authorizationUrl: string; state: string } {
    const generatedState = state || this.generateState();
    const effectiveScopes = scopes?.length ? scopes : this.SCOPES;

    const oauth2Client = redirectUri
      ? new OAuth2Client({
          clientId: this.configService.get<string>('GOOGLE_CLIENT_ID'),
          clientSecret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
          redirectUri,
        })
      : this.oauth2Client;

    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: effectiveScopes,
      state: generatedState,
      prompt: 'consent',
      include_granted_scopes: true,
    });

    return { authorizationUrl, state: generatedState };
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(
    code: string,
    redirectUri?: string,
  ): Promise<GoogleTokens> {
    try {
      const oauth2Client = redirectUri
        ? new OAuth2Client({
            clientId: this.configService.get<string>('GOOGLE_CLIENT_ID'),
            clientSecret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
            redirectUri,
          })
        : this.oauth2Client;

      const { tokens } = await oauth2Client.getToken(code);

      return this.formatTokens(tokens);
    } catch (error) {
      this.logger.error('Failed to exchange Google authorization code', error);
      throw new Error(`Failed to exchange authorization code: ${error.message}`);
    }
  }

  /**
   * Refresh an access token using the refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      return this.formatTokens(credentials);
    } catch (error) {
      this.logger.error('Failed to refresh Google access token', error);
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }
  }

  /**
   * Get user info from Google
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      this.oauth2Client.setCredentials({
        access_token: accessToken,
      });

      const oauth2 = google.oauth2({
        auth: this.oauth2Client,
        version: 'v2',
      });

      const { data } = await oauth2.userinfo.get();

      return {
        email: data.email || '',
        name: data.name || '',
        picture: data.picture || undefined,
        locale: data.locale || undefined,
      };
    } catch (error) {
      this.logger.error('Failed to get Google user info', error);
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }

  /**
   * Revoke a token
   */
  async revokeToken(token: string): Promise<void> {
    try {
      await this.oauth2Client.revokeToken(token);
      this.logger.log('Google token revoked successfully');
    } catch (error) {
      this.logger.error('Failed to revoke Google token', error);
      throw new Error(`Failed to revoke token: ${error.message}`);
    }
  }

  /**
   * Send email using Gmail API
   */
  async sendEmail(
    accessToken: string,
    refreshToken: string,
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
      this.oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      // Build the email message
      const message = this.buildMimeMessage(options);
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      return { messageId: response.data.id || '' };
    } catch (error) {
      this.logger.error('Failed to send email via Gmail', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Get emails from Gmail
   */
  async getEmails(
    accessToken: string,
    refreshToken: string,
    options: {
      folder?: string;
      limit?: number;
      pageToken?: string;
      query?: string;
    },
  ): Promise<{
    emails: Array<{
      id: string;
      threadId: string;
      snippet: string;
    }>;
    nextPageToken?: string;
  }> {
    try {
      this.oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      const labelIds = options.folder ? [options.folder.toUpperCase()] : ['INBOX'];

      const response = await gmail.users.messages.list({
        userId: 'me',
        labelIds,
        maxResults: options.limit || 20,
        pageToken: options.pageToken,
        q: options.query,
      });

      const emails = (response.data.messages || []).map((msg) => ({
        id: msg.id || '',
        threadId: msg.threadId || '',
        snippet: '',
      }));

      return {
        emails,
        nextPageToken: response.data.nextPageToken || undefined,
      };
    } catch (error) {
      this.logger.error('Failed to get emails from Gmail', error);
      throw new Error(`Failed to get emails: ${error.message}`);
    }
  }

  /**
   * Get a single email from Gmail
   */
  async getEmail(
    accessToken: string,
    refreshToken: string,
    emailId: string,
  ): Promise<{
    id: string;
    threadId: string;
    subject: string;
    from: { email: string; name?: string };
    to: Array<{ email: string; name?: string }>;
    textBody?: string;
    htmlBody?: string;
    receivedAt: string;
  }> {
    try {
      this.oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      const response = await gmail.users.messages.get({
        userId: 'me',
        id: emailId,
        format: 'full',
      });

      const headers = response.data.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

      const parseEmailAddress = (value: string): { email: string; name?: string } => {
        const match = value.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
        if (match) {
          return { email: match[2], name: match[1] };
        }
        return { email: value };
      };

      // Extract body
      let textBody = '';
      let htmlBody = '';
      const parts = response.data.payload?.parts || [];

      const extractBody = (part: any) => {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          textBody = Buffer.from(part.body.data, 'base64').toString('utf8');
        }
        if (part.mimeType === 'text/html' && part.body?.data) {
          htmlBody = Buffer.from(part.body.data, 'base64').toString('utf8');
        }
        if (part.parts) {
          part.parts.forEach(extractBody);
        }
      };

      if (response.data.payload?.body?.data) {
        const body = Buffer.from(response.data.payload.body.data, 'base64').toString('utf8');
        if (response.data.payload.mimeType === 'text/html') {
          htmlBody = body;
        } else {
          textBody = body;
        }
      }
      parts.forEach(extractBody);

      return {
        id: response.data.id || '',
        threadId: response.data.threadId || '',
        subject: getHeader('Subject'),
        from: parseEmailAddress(getHeader('From')),
        to: getHeader('To').split(',').map((t) => parseEmailAddress(t.trim())),
        textBody,
        htmlBody,
        receivedAt: new Date(parseInt(response.data.internalDate || '0')).toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get email from Gmail', error);
      throw new Error(`Failed to get email: ${error.message}`);
    }
  }

  private formatTokens(credentials: Credentials): GoogleTokens {
    return {
      accessToken: credentials.access_token || '',
      refreshToken: credentials.refresh_token || undefined,
      expiresIn: credentials.expiry_date
        ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
        : 3600,
      tokenType: credentials.token_type || 'Bearer',
      idToken: credentials.id_token || undefined,
    };
  }

  private generateState(): string {
    return Buffer.from(
      JSON.stringify({
        timestamp: Date.now(),
        random: Math.random().toString(36).substring(2),
      }),
    ).toString('base64');
  }

  private buildMimeMessage(options: {
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
  }): string {
    const boundary = `boundary_${Date.now()}`;
    const lines: string[] = [];

    lines.push(`To: ${options.to.join(', ')}`);
    if (options.cc?.length) {
      lines.push(`Cc: ${options.cc.join(', ')}`);
    }
    if (options.bcc?.length) {
      lines.push(`Bcc: ${options.bcc.join(', ')}`);
    }
    if (options.replyTo) {
      lines.push(`Reply-To: ${options.replyTo}`);
    }
    lines.push(`Subject: ${options.subject}`);
    lines.push('MIME-Version: 1.0');

    if (options.attachments?.length) {
      lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
      lines.push('');
      lines.push(`--${boundary}`);
    }

    if (options.htmlBody && options.textBody) {
      const altBoundary = `alt_${Date.now()}`;
      lines.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`);
      lines.push('');
      lines.push(`--${altBoundary}`);
      lines.push('Content-Type: text/plain; charset=utf-8');
      lines.push('');
      lines.push(options.textBody);
      lines.push(`--${altBoundary}`);
      lines.push('Content-Type: text/html; charset=utf-8');
      lines.push('');
      lines.push(options.htmlBody);
      lines.push(`--${altBoundary}--`);
    } else if (options.htmlBody) {
      lines.push('Content-Type: text/html; charset=utf-8');
      lines.push('');
      lines.push(options.htmlBody);
    } else {
      lines.push('Content-Type: text/plain; charset=utf-8');
      lines.push('');
      lines.push(options.textBody || '');
    }

    if (options.attachments?.length) {
      for (const attachment of options.attachments) {
        lines.push(`--${boundary}`);
        lines.push(
          `Content-Type: ${attachment.contentType}; name="${attachment.filename}"`,
        );
        lines.push('Content-Transfer-Encoding: base64');
        lines.push(
          `Content-Disposition: attachment; filename="${attachment.filename}"`,
        );
        if (attachment.contentId) {
          lines.push(`Content-ID: <${attachment.contentId}>`);
        }
        lines.push('');
        lines.push(attachment.content.toString('base64'));
      }
      lines.push(`--${boundary}--`);
    }

    return lines.join('\r\n');
  }
}
