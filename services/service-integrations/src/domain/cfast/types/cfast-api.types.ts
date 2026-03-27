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

// ─── Core API Write DTOs (schemas unconfirmed — fields are liberal) ───

export interface CfastCreateCustomerDto {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface CfastCreateCustomerResponse {
  id: string;
  [key: string]: unknown;
}

export interface CfastAddressDto {
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  [key: string]: unknown;
}

export interface CfastAddressResponse {
  id: string;
  [key: string]: unknown;
}

export interface CfastContactDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface CfastContactResponse {
  id: string;
  [key: string]: unknown;
}

export interface CfastCreateContractDto {
  reference?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  amount?: number;
  [key: string]: unknown;
}

export interface CfastCreateContractResponse {
  id: string;
  [key: string]: unknown;
}

export interface CfastUploadFileResponse {
  id?: string;
  fileId?: string;
  [key: string]: unknown;
}

export interface CfastCreateBillingPointDto {
  name?: string;
  [key: string]: unknown;
}

export interface CfastCreateBillingPointResponse {
  id: string;
  [key: string]: unknown;
}

export interface CfastCreateSiteDto {
  name?: string;
  [key: string]: unknown;
}

export interface CfastCreateSiteResponse {
  id: string;
  [key: string]: unknown;
}

export interface CfastCreateServiceDto {
  name?: string;
  code?: string;
  price?: number;
  billingFrequency?: string;
  [key: string]: unknown;
}

export interface CfastCreateServiceResponse {
  id: string;
  [key: string]: unknown;
}

export interface CfastMarkPaidDto {
  amount?: number;
  paidAt?: string;
  paymentMethod?: string;
  [key: string]: unknown;
}

export interface CfastMarkPaidResponse {
  id?: string;
  [key: string]: unknown;
}
