import { Catch, RpcExceptionFilter, ArgumentsHost, Logger, BadRequestException } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';
import {
  DomainException,
  NotFoundException,
  AlreadyExistsException,
  InvalidDataException,
  BusinessRuleException,
  VersionConflictException,
  UnauthorizedException,
} from '../../exceptions/index.js';

/**
 * Filter pour mapper les exceptions du domaine vers les codes gRPC
 *
 * Mapping:
 * - NotFoundException -> NOT_FOUND (5)
 * - AlreadyExistsException -> ALREADY_EXISTS (6)
 * - InvalidDataException -> INVALID_ARGUMENT (3)
 * - BusinessRuleException -> FAILED_PRECONDITION (9)
 * - VersionConflictException -> ABORTED (10)
 * - UnauthorizedException -> PERMISSION_DENIED (7)
 * - Autres -> INTERNAL (13)
 */
@Catch()
export class GrpcExceptionFilter implements RpcExceptionFilter<Error> {
  private readonly logger = new Logger(GrpcExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost): Observable<any> {
    const ctx = host.switchToRpc();
    const data = ctx.getData();

    const correlationId = data?.correlationId || data?.eventId || 'unknown';
    const grpcStatus = this.getGrpcStatus(exception);

    this.logException(exception, grpcStatus, correlationId, data);

    const errorResponse = {
      code: grpcStatus,
      message: exception.message,
      details: this.getErrorDetails(exception),
    };

    const rpcException = new RpcException(errorResponse) as RpcException & {
      code?: number;
      details?: unknown;
    };
    rpcException.code = grpcStatus;
    rpcException.details = errorResponse.details;

    return throwError(() => rpcException);
  }

  private getGrpcStatus(exception: Error): number {
    if (exception instanceof RpcException) {
      const error = exception.getError();
      return typeof error === 'object' && 'code' in error
        ? (error as any).code
        : GrpcStatus.UNKNOWN;
    }

    if (exception instanceof NotFoundException) return GrpcStatus.NOT_FOUND;
    if (exception instanceof AlreadyExistsException) return GrpcStatus.ALREADY_EXISTS;
    if (exception instanceof InvalidDataException) return GrpcStatus.INVALID_ARGUMENT;
    if (exception instanceof BusinessRuleException) return GrpcStatus.FAILED_PRECONDITION;
    if (exception instanceof VersionConflictException) return GrpcStatus.ABORTED;
    if (exception instanceof UnauthorizedException) return GrpcStatus.PERMISSION_DENIED;
    if (exception instanceof BadRequestException) return GrpcStatus.INVALID_ARGUMENT;

    return GrpcStatus.INTERNAL;
  }

  private getErrorDetails(exception: Error): any {
    if (exception instanceof DomainException) {
      return {
        code: exception.code,
        metadata: exception.metadata,
      };
    }

    if (exception instanceof RpcException) {
      return exception.getError();
    }

    return {
      type: exception.constructor.name,
    };
  }

  private logException(
    exception: Error,
    grpcStatus: number,
    correlationId: string,
    data: any,
  ): void {
    const logContext = {
      correlationId,
      grpcStatus,
      grpcStatusName: this.getStatusName(grpcStatus),
      exceptionType: exception.constructor.name,
      message: exception.message,
      ...(exception instanceof DomainException && {
        code: exception.code,
        metadata: exception.metadata,
      }),
    };

    if (this.isClientError(grpcStatus)) {
      this.logger.warn('Client error in gRPC call', logContext);
    } else {
      this.logger.error('Server error in gRPC call', {
        ...logContext,
        stack: exception.stack,
        requestData: data,
      });
    }
  }

  private isClientError(grpcStatus: number): boolean {
    return [
      GrpcStatus.INVALID_ARGUMENT,
      GrpcStatus.NOT_FOUND,
      GrpcStatus.ALREADY_EXISTS,
      GrpcStatus.PERMISSION_DENIED,
      GrpcStatus.FAILED_PRECONDITION,
      GrpcStatus.ABORTED,
      GrpcStatus.OUT_OF_RANGE,
      GrpcStatus.UNAUTHENTICATED,
    ].includes(grpcStatus);
  }

  private getStatusName(code: number): string {
    const statusNames: Record<number, string> = {
      [GrpcStatus.OK]: 'OK',
      [GrpcStatus.CANCELLED]: 'CANCELLED',
      [GrpcStatus.UNKNOWN]: 'UNKNOWN',
      [GrpcStatus.INVALID_ARGUMENT]: 'INVALID_ARGUMENT',
      [GrpcStatus.DEADLINE_EXCEEDED]: 'DEADLINE_EXCEEDED',
      [GrpcStatus.NOT_FOUND]: 'NOT_FOUND',
      [GrpcStatus.ALREADY_EXISTS]: 'ALREADY_EXISTS',
      [GrpcStatus.PERMISSION_DENIED]: 'PERMISSION_DENIED',
      [GrpcStatus.RESOURCE_EXHAUSTED]: 'RESOURCE_EXHAUSTED',
      [GrpcStatus.FAILED_PRECONDITION]: 'FAILED_PRECONDITION',
      [GrpcStatus.ABORTED]: 'ABORTED',
      [GrpcStatus.OUT_OF_RANGE]: 'OUT_OF_RANGE',
      [GrpcStatus.UNIMPLEMENTED]: 'UNIMPLEMENTED',
      [GrpcStatus.INTERNAL]: 'INTERNAL',
      [GrpcStatus.UNAVAILABLE]: 'UNAVAILABLE',
      [GrpcStatus.DATA_LOSS]: 'DATA_LOSS',
      [GrpcStatus.UNAUTHENTICATED]: 'UNAUTHENTICATED',
    };

    return statusNames[code] || 'UNKNOWN';
  }
}
