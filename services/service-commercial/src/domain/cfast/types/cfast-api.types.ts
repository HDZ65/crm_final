export interface CfastCustomer {
  nom: string;
  prenom: string;
  telephone: string;
  [key: string]: unknown;
}

export interface CfastBillingSession {
  id: string;
  monthBill?: string;
  status?: string;
  [key: string]: unknown;
}

export interface CfastInvoice {
  id: string;
  billingSessionId?: string;
  customer?: CfastCustomer | null;
  [key: string]: unknown;
}

export interface CfastInvoiceDetail extends CfastInvoice {
  lines?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface CfastPaginatedResponse<T> {
  data?: T[];
  items?: T[];
  results?: T[];
  rows?: T[];
  total?: number;
  [key: string]: unknown;
}

export interface CfastOAuthTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}
