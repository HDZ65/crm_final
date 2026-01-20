export interface ContractOrchestrationPort {
  activate(
    contractId: string,
    payload?: Record<string, unknown>,
  ): Promise<void>;
  suspend(contractId: string, payload?: Record<string, unknown>): Promise<void>;
  terminate(
    contractId: string,
    payload?: Record<string, unknown>,
  ): Promise<void>;
  portIn(contractId: string, payload?: Record<string, unknown>): Promise<void>;
}
