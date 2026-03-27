import { HttpException, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

export function wrapGrpcCall<T>(
  call$: Observable<T>,
  logger: Logger,
  serviceName: string,
  methodName: string,
): Observable<T> {
  return call$.pipe(
    catchError((error: unknown) => {
      const err = error as Error;
      logger.error(
        `gRPC error calling ${serviceName}.${methodName}: ${err.message}`,
        err.stack,
      );
      throw new HttpException('Service unavailable', 503);
    }),
  );
}
