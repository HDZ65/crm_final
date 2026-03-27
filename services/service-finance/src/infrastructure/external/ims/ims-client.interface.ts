/**
 * IMS (Information Management System) client interface.
 * Used by the dunning workflow to notify external systems of subscription state changes.
 */
export interface NotifySuspensionInput {
  subscriptionId: string;
  clientId: string;
  organisationId: string;
  reason: string;
  effectiveDate: string;
}

export interface NotifySuspensionResult {
  acknowledged: boolean;
  externalRef?: string;
}

export const IMS_CLIENT_TOKEN = 'IImsClient';

export interface IImsClient {
  notifySuspension(input: NotifySuspensionInput): Promise<NotifySuspensionResult>;
}
