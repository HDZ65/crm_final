import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Intercepteur pour logger toutes les tentatives de modification de factures
 * Permet un audit trail complet pour la conformité légale
 * Supporte les contextes HTTP et gRPC
 */
@Injectable()
export class ImmutabilityInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType = context.getType();
    let logInfo: { invoiceId?: string; action: string; source: string; data?: any };

    if (contextType === 'http') {
      // Contexte HTTP (REST API)
      const request = context.switchToHttp().getRequest();
      if (request) {
        const { method, url, params, body } = request;
        logInfo = {
          invoiceId: params?.id,
          action: method || 'UNKNOWN',
          source: `HTTP ${url || 'unknown'}`,
          data: body,
        };
      } else {
        logInfo = { action: 'UNKNOWN', source: 'HTTP' };
      }
    } else if (contextType === 'rpc') {
      // Contexte gRPC
      const rpcContext = context.switchToRpc();
      const data = rpcContext.getData();
      const handler = context.getHandler().name;
      logInfo = {
        invoiceId: data?.id,
        action: handler,
        source: 'gRPC',
        data: data,
      };
    } else {
      // Autre contexte (WebSocket, etc.)
      logInfo = {
        action: context.getHandler().name,
        source: contextType,
      };
    }

    // Log de la requête
    console.log(`[AUDIT] ${logInfo.action} (${logInfo.source})`, {
      invoiceId: logInfo.invoiceId,
      timestamp: new Date().toISOString(),
      data: logInfo.data,
    });

    return next.handle().pipe(
      tap((responseData) => {
        // Log de la réponse
        console.log(`[AUDIT] Response for ${logInfo.action} (${logInfo.source})`, {
          success: true,
          timestamp: new Date().toISOString(),
        });
      }),
    );
  }
}
