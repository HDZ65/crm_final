import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare const REQUEST_ID_HEADER = "x-request-id";
export declare const REQUEST_ID_KEY = "requestId";
export declare const USER_ID_KEY = "userId";
export declare class RequestIdInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private extractUserIdFromHttpRequest;
    private extractUserIdFromRpcContext;
}
//# sourceMappingURL=request-id.interceptor.d.ts.map