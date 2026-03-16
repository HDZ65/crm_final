/**
 * Common interface for all telecom carrier provisioning operations.
 *
 * Implementations: Transatel, Networth, Stelogy.
 * Used by CarrierSelectorService to abstract carrier selection.
 */
export interface TelecomCarrierPort {
  activateLine(
    contratId: string,
    clientId: string,
    msisdn: string,
    iccid: string,
    correlationId: string,
  ): Promise<{ activationId: string }>;

  suspendLine(
    contratId: string,
    clientId: string,
    reason: string,
    correlationId: string,
  ): Promise<{ suspensionId: string }>;

  terminateLine(
    contratId: string,
    clientId: string,
    reason: string,
    effectiveDate: string,
    correlationId: string,
  ): Promise<{ terminationId: string }>;
}

export const TELECOM_CARRIER_PORT = 'TELECOM_CARRIER_PORT';
