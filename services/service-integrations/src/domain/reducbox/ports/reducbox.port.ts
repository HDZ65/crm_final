export interface ReducBoxPort {
  createAccess(clientId: string, contratId: string): Promise<{ externalAccessId: string }>;
  suspendAccess(externalAccessId: string, reason: string): Promise<void>;
  restoreAccess(externalAccessId: string): Promise<void>;
  cancelAccess(externalAccessId: string): Promise<void>;
}

export const REDUCBOX_PORT = 'REDUCBOX_PORT';
