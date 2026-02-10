import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AppLoggerService } from '../logging/logger.service.js';
export declare class LoggingInterceptor implements NestInterceptor {
    private readonly logger;
    constructor(logger: AppLoggerService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
//# sourceMappingURL=logging.interceptor.d.ts.map