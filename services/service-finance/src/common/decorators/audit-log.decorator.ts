import { SetMetadata } from '@nestjs/common';

/**
 * Décorateur pour marquer les actions nécessitant un audit log
 * Utilisé pour tracer toutes les modifications de factures
 */
export const AUDIT_LOG_KEY = 'audit_log';

export interface AuditLogMetadata {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VALIDATE' | 'CANCEL';
  entity: string;
}

export const AuditLog = (metadata: AuditLogMetadata) =>
  SetMetadata(AUDIT_LOG_KEY, metadata);
