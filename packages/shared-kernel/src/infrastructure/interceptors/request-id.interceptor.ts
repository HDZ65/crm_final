import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { randomUUID } from 'crypto';

export const REQUEST_ID_HEADER = 'x-request-id';
export const REQUEST_ID_KEY = 'requestId';
export const USER_ID_KEY = 'userId';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const type = context.getType();
    let requestId: string;
    let userId: string | undefined;

    if (type === 'http') {
      const request = context.switchToHttp().getRequest();
      requestId = request.headers[REQUEST_ID_HEADER] || randomUUID();
      userId = this.extractUserIdFromHttpRequest(request);
      request[REQUEST_ID_KEY] = { requestId, userId };

      const response = context.switchToHttp().getResponse();
      response.setHeader(REQUEST_ID_HEADER, requestId);
    } else if (type === 'rpc') {
      const rpcContext = context.switchToRpc();
      const metadata = rpcContext.getContext();
      requestId = metadata?.[REQUEST_ID_HEADER] || randomUUID();
      userId = this.extractUserIdFromRpcContext(rpcContext);

      if (metadata) {
        metadata[REQUEST_ID_KEY] = { requestId, userId };
      }
    } else {
      requestId = randomUUID();
      userId = undefined;
    }

    context.switchToHttp().getRequest()[REQUEST_ID_KEY] = { requestId, userId };

    return next.handle();
  }

  private extractUserIdFromHttpRequest(request: any): string | undefined {
    return request?.query?.userId ||
           request?.body?.userId ||
           request?.headers?.['x-user-id'] ||
           request?.user?.id ||
           request?.['userId'] ||
           undefined;
  }

  private extractUserIdFromRpcContext(rpcContext: any): string | undefined {
    const data = rpcContext.getData();
    return data?.userId ||
           data?.initiatedBy ||
           data?.ownerId ||
           data?.callerId ||
           undefined;
  }
}
