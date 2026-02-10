import { LoggerService as NestLoggerService } from '@nestjs/common';
export interface LogContext {
    requestId?: string;
    userId?: string;
    entityId?: string;
    duration?: number;
    [key: string]: any;
}
export declare class AppLoggerService implements NestLoggerService {
    private context?;
    private requestId?;
    setContext(context: string): void;
    setRequestId(requestId: string): void;
    log(message: string, context?: LogContext): void;
    error(message: string, trace?: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
    verbose(message: string, context?: LogContext): void;
    private print;
}
//# sourceMappingURL=logger.service.d.ts.map