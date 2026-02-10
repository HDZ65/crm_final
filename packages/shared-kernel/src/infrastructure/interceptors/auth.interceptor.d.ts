import type { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
export declare class AuthInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Promise<import("rxjs").Observable<any>>;
    private extractAuthorization;
    private isInternalCall;
    private extractUserId;
    private isPublicEndpoint;
}
//# sourceMappingURL=auth.interceptor.d.ts.map