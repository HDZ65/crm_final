/**
 * Port for Networth carrier provisioning operations.
 *
 * Supports: activateLine, suspendLine, terminateLine.
 * Env: TELECOM_CARRIER=transatel|networth|stelogy
 */
export interface ProvisioningNetworthPort {
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
