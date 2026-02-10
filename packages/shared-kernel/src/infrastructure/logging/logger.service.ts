import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

export interface LogContext {
  requestId?: string;
  userId?: string;
  entityId?: string;
  duration?: number;
  [key: string]: any;
}

@Injectable()
export class AppLoggerService implements NestLoggerService {
  private context?: string;
  private requestId?: string;

  setContext(context: string) {
    this.context = context;
  }

  setRequestId(requestId: string) {
    this.requestId = requestId;
  }

  log(message: string, context?: LogContext) {
    this.print('info', message, context);
  }

  error(message: string, trace?: string, context?: LogContext) {
    this.print('error', message, { ...context, trace });
  }

  warn(message: string, context?: LogContext) {
    this.print('warn', message, context);
  }

  debug(message: string, context?: LogContext) {
    this.print('debug', message, context);
  }

  verbose(message: string, context?: LogContext) {
    this.print('verbose', message, context);
  }

  private print(level: string, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      context: this.context,
      requestId: this.requestId,
      ...context,
    };

    const output = JSON.stringify(logEntry);

    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'debug':
      case 'verbose':
        if (process.env.NODE_ENV !== 'production') {
          console.log(output);
        }
        break;
      default:
        console.log(output);
    }
  }
}
