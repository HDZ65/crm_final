import {
  Injectable,
  Logger,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { IbanMaskingService } from './iban-masking.service';

@Injectable()
export class SensitiveDataInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SensitiveDataInterceptor.name);

  constructor(private readonly ibanMaskingService: IbanMaskingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'rpc') {
      return next.handle();
    }

    const handlerName = `${context.getClass().name}.${context.getHandler().name}`;

    return next.handle().pipe(
      tap({
        next: (response) => {
          const serializedResponse = this.serialize(response);
          const maskedResponse = this.ibanMaskingService.maskInLog(serializedResponse);
          this.logger.log(`[gRPC] ${handlerName} response=${maskedResponse}`);
        },
      }),
    );
  }

  private serialize(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }

    try {
      const serialized = JSON.stringify(value);
      return typeof serialized === 'string' ? serialized : '[empty-response]';
    } catch {
      return '[unserializable-response]';
    }
  }
}
