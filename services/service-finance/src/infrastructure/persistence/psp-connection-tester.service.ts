import { Injectable } from '@nestjs/common';

export interface PspConnectionTestResult {
  success: boolean;
  message: string;
  details?: string;
}

@Injectable()
export class PspConnectionTesterService {
  async testConnection(
    pspType: string,
    credentials: any,
  ): Promise<PspConnectionTestResult> {
    const normalizedPsp = String(pspType || '').trim().toLowerCase();

    switch (normalizedPsp) {
      case 'stripe':
        return this.testStripe(credentials);
      case 'gocardless':
        return this.testGoCardless(credentials);
      case 'slimpay':
        return this.testSlimpay(credentials);
      case 'multisafepay':
        return this.testMultiSafepay(credentials);
      case 'emerchantpay':
        return this.testEmerchantpay(credentials);
      case 'paypal':
        return this.testPayPal(credentials);
      default:
        return {
          success: false,
          message: `Unsupported PSP type: ${pspType}`,
          details: 'Supported values: stripe, gocardless, slimpay, multisafepay, emerchantpay, paypal.',
        };
    }
  }

  private async testStripe(credentials: any): Promise<PspConnectionTestResult> {
    if (!credentials?.stripeSecretKey) {
      return {
        success: false,
        message: 'Stripe connection test failed: missing stripeSecretKey.',
      };
    }

    try {
      const response = await this.request('https://api.stripe.com/v1/balance', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${credentials.stripeSecretKey}`,
        },
      });

      if (!response.ok) {
        return this.buildHttpFailure('Stripe', response.status, response.bodyText);
      }

      return {
        success: true,
        message: 'Stripe connection test succeeded.',
      };
    } catch (error) {
      return this.buildExceptionFailure('Stripe', error);
    }
  }

  private async testGoCardless(credentials: any): Promise<PspConnectionTestResult> {
    if (!credentials?.accessToken) {
      return {
        success: false,
        message: 'GoCardless connection test failed: missing accessToken.',
      };
    }

    const baseUrl = credentials?.isSandbox
      ? 'https://api-sandbox.gocardless.com/'
      : 'https://api.gocardless.com/';

    try {
      const response = await this.request(baseUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return this.buildHttpFailure('GoCardless', response.status, response.bodyText);
      }

      return {
        success: true,
        message: 'GoCardless connection test succeeded.',
      };
    } catch (error) {
      return this.buildExceptionFailure('GoCardless', error);
    }
  }

  private async testSlimpay(credentials: any): Promise<PspConnectionTestResult> {
    if (!credentials?.appName || !credentials?.appSecret) {
      return {
        success: false,
        message: 'Slimpay connection test failed: missing appName or appSecret.',
      };
    }

    const tokenUrl = credentials?.isSandbox
      ? 'https://api.preprod.slimpay.net/oauth/token'
      : 'https://api.slimpay.net/oauth/token';

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: credentials.appName,
      client_secret: credentials.appSecret,
    });

    try {
      const response = await this.request(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        return this.buildHttpFailure('Slimpay', response.status, response.bodyText);
      }

      const parsed = this.safeJson(response.bodyText);
      if (!parsed?.access_token) {
        return {
          success: false,
          message: 'Slimpay connection test failed: OAuth response missing access_token.',
        };
      }

      return {
        success: true,
        message: 'Slimpay connection test succeeded.',
      };
    } catch (error) {
      return this.buildExceptionFailure('Slimpay', error);
    }
  }

  private async testMultiSafepay(credentials: any): Promise<PspConnectionTestResult> {
    if (!credentials?.apiKey) {
      return {
        success: false,
        message: 'MultiSafepay connection test failed: missing apiKey.',
      };
    }

    const gatewayUrl = credentials?.isSandbox
      ? 'https://testapi.multisafepay.com/v1/json/gateways'
      : 'https://api.multisafepay.com/v1/json/gateways';

    try {
      const response = await this.request(gatewayUrl, {
        method: 'GET',
        headers: {
          api_key: credentials.apiKey,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return this.buildHttpFailure('MultiSafepay', response.status, response.bodyText);
      }

      return {
        success: true,
        message: 'MultiSafepay connection test succeeded.',
      };
    } catch (error) {
      return this.buildExceptionFailure('MultiSafepay', error);
    }
  }

  private async testEmerchantpay(credentials: any): Promise<PspConnectionTestResult> {
    if (!credentials?.apiLogin || !credentials?.apiPassword) {
      return {
        success: false,
        message: 'Emerchantpay connection test failed: missing apiLogin or apiPassword.',
      };
    }

    const baseUrl = credentials?.isSandbox
      ? 'https://staging.gate.emerchantpay.com'
      : 'https://gate.emerchantpay.com';
    const endpoint = `${baseUrl}/api/v1/reconcile/transactions`;
    const auth = Buffer.from(`${credentials.apiLogin}:${credentials.apiPassword}`).toString('base64');

    try {
      const response = await this.request(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ page: 1 }),
      });

      if (!response.ok) {
        return this.buildHttpFailure('Emerchantpay', response.status, response.bodyText);
      }

      return {
        success: true,
        message: 'Emerchantpay connection test succeeded.',
      };
    } catch (error) {
      return this.buildExceptionFailure('Emerchantpay', error);
    }
  }

  private async testPayPal(credentials: any): Promise<PspConnectionTestResult> {
    if (!credentials?.clientId || !credentials?.clientSecret) {
      return {
        success: false,
        message: 'PayPal connection test failed: missing clientId or clientSecret.',
      };
    }

    const tokenUrl = credentials?.isSandbox
      ? 'https://api.sandbox.paypal.com/v1/oauth2/token'
      : 'https://api.paypal.com/v1/oauth2/token';
    const auth = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64');

    try {
      const response = await this.request(tokenUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        return this.buildHttpFailure('PayPal', response.status, response.bodyText);
      }

      const parsed = this.safeJson(response.bodyText);
      if (!parsed?.access_token) {
        return {
          success: false,
          message: 'PayPal connection test failed: OAuth response missing access_token.',
        };
      }

      return {
        success: true,
        message: 'PayPal connection test succeeded.',
      };
    } catch (error) {
      return this.buildExceptionFailure('PayPal', error);
    }
  }

  private async request(
    url: string,
    init: RequestInit,
  ): Promise<{ ok: boolean; status: number; bodyText: string }> {
    const response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(5000),
    });

    return {
      ok: response.ok,
      status: response.status,
      bodyText: await response.text(),
    };
  }

  private buildHttpFailure(
    pspName: string,
    status: number,
    responseText: string,
  ): PspConnectionTestResult {
    return {
      success: false,
      message: `${pspName} connection test failed with HTTP ${status}.`,
      details: this.trimDetails(responseText),
    };
  }

  private buildExceptionFailure(pspName: string, error: unknown): PspConnectionTestResult {
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return {
          success: false,
          message: `${pspName} connection test timed out after 5 seconds.`,
          details: error.message,
        };
      }

      return {
        success: false,
        message: `${pspName} connection test failed due to a network or API error.`,
        details: error.message,
      };
    }

    return {
      success: false,
      message: `${pspName} connection test failed due to an unknown error.`,
      details: String(error),
    };
  }

  private safeJson(value: string): any {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  private trimDetails(text: string): string {
    if (!text) {
      return '';
    }

    return text.length > 400 ? `${text.slice(0, 400)}...` : text;
  }
}
