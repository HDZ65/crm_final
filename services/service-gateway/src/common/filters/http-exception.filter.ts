import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string | string[];
    let error: string;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as { message?: string | string[]; error?: string };
      message = resp.message ?? exception.message;
      error = resp.error ?? HttpStatus[status] ?? 'Error';
    } else {
      message = exception.message;
      error = HttpStatus[status] ?? 'Error';
    }

    const body = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error,
      message,
    };

    if (status >= 500) {
      this.logger.error(
        `HTTP ${status} ${request.method} ${request.url}: ${JSON.stringify(message)}`,
      );
    } else {
      this.logger.warn(
        `HTTP ${status} ${request.method} ${request.url}: ${JSON.stringify(message)}`,
      );
    }

    response.status(status).json(body);
  }
}
