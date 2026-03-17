export interface ProvisioningTerminationPort {
  terminateLine(
    contratId: string,
    clientId: string,
    reason: string,
    effectiveDate: string,
    correlationId: string,
  ): Promise<{ terminationId: string }>;
}
