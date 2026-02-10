import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLoggerService } from '../logging/logger.service.js';
import { REQUEST_ID_KEY } from './request-id.interceptor.js';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const type = context.getType();
    const handler = context.getHandler().name;
    const className = context.getClass().name;

    let requestId: string;
    let userId: string | undefined;
    let method: string;
    let url: string;

    if (type === 'http') {
      const request = context.switchToHttp().getRequest();
      const requestContext = request[REQUEST_ID_KEY] as any;

      requestId = typeof requestContext === 'string' ? requestContext : requestContext?.requestId;
      method = request.method;
      url = request.url;
      userId = typeof requestContext === 'string' ? undefined : requestContext?.userId;

      this.logger.setRequestId(requestId);
      this.logger.log(`Incoming Request: ${method} ${url}`, {
        requestId,
        userId,
        handler: `${className}.${handler}`,
      });
    } else if (type === 'rpc') {
      const rpcContext = context.switchToRpc();
      const metadata = rpcContext.getContext();
      const requestContext = metadata?.[REQUEST_ID_KEY] as any;

      requestId = typeof requestContext === 'string' ? requestContext : requestContext?.requestId;
      method = handler;
      userId = typeof requestContext === 'string' ? undefined : requestContext?.userId;

      this.logger.setRequestId(requestId);
      this.logger.log(`Incoming gRPC Call: ${method}`, {
        requestId,
        userId,
        handler: `${className}.${handler}`,
      });
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - now;
          this.logger.log(`Request completed`, {
            requestId,
            userId,
            duration,
            handler: `${className}.${handler}`,
          });
        },
        error: (error) => {
          const duration = Date.now() - now;
          this.logger.error(`Request failed`, error.stack, {
            requestId,
            userId,
            duration,
            handler: `${className}.${handler}`,
            error: error.message,
          });
        },
      }),
    );
  }
}
