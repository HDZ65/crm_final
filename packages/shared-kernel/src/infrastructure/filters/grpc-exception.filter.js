"use strict";
var GrpcExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrpcExceptionFilter = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const grpc_js_1 = require("@grpc/grpc-js");
const microservices_1 = require("@nestjs/microservices");
const index_js_1 = require("../../exceptions/index.js");
let GrpcExceptionFilter = GrpcExceptionFilter_1 = class GrpcExceptionFilter {
    logger = new common_1.Logger(GrpcExceptionFilter_1.name);
    catch(exception, host) {
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
        const rpcException = new microservices_1.RpcException(errorResponse);
        rpcException.code = grpcStatus;
        rpcException.details = errorResponse.details;
        return (0, rxjs_1.throwError)(() => rpcException);
    }
    getGrpcStatus(exception) {
        if (exception instanceof microservices_1.RpcException) {
            const error = exception.getError();
            return typeof error === 'object' && 'code' in error
                ? error.code
                : grpc_js_1.status.UNKNOWN;
        }
        if (exception instanceof index_js_1.NotFoundException)
            return grpc_js_1.status.NOT_FOUND;
        if (exception instanceof index_js_1.AlreadyExistsException)
            return grpc_js_1.status.ALREADY_EXISTS;
        if (exception instanceof index_js_1.InvalidDataException)
            return grpc_js_1.status.INVALID_ARGUMENT;
        if (exception instanceof index_js_1.BusinessRuleException)
            return grpc_js_1.status.FAILED_PRECONDITION;
        if (exception instanceof index_js_1.VersionConflictException)
            return grpc_js_1.status.ABORTED;
        if (exception instanceof index_js_1.UnauthorizedException)
            return grpc_js_1.status.PERMISSION_DENIED;
        if (exception instanceof common_1.BadRequestException)
            return grpc_js_1.status.INVALID_ARGUMENT;
        return grpc_js_1.status.INTERNAL;
    }
    getErrorDetails(exception) {
        if (exception instanceof index_js_1.DomainException) {
            return {
                code: exception.code,
                metadata: exception.metadata,
            };
        }
        if (exception instanceof microservices_1.RpcException) {
            return exception.getError();
        }
        return {
            type: exception.constructor.name,
        };
    }
    logException(exception, grpcStatus, correlationId, data) {
        const logContext = {
            correlationId,
            grpcStatus,
            grpcStatusName: this.getStatusName(grpcStatus),
            exceptionType: exception.constructor.name,
            message: exception.message,
            ...(exception instanceof index_js_1.DomainException && {
                code: exception.code,
                metadata: exception.metadata,
            }),
        };
        if (this.isClientError(grpcStatus)) {
            this.logger.warn('Client error in gRPC call', logContext);
        }
        else {
            this.logger.error('Server error in gRPC call', {
                ...logContext,
                stack: exception.stack,
                requestData: data,
            });
        }
    }
    isClientError(grpcStatus) {
        return [
            grpc_js_1.status.INVALID_ARGUMENT,
            grpc_js_1.status.NOT_FOUND,
            grpc_js_1.status.ALREADY_EXISTS,
            grpc_js_1.status.PERMISSION_DENIED,
            grpc_js_1.status.FAILED_PRECONDITION,
            grpc_js_1.status.ABORTED,
            grpc_js_1.status.OUT_OF_RANGE,
            grpc_js_1.status.UNAUTHENTICATED,
        ].includes(grpcStatus);
    }
    getStatusName(code) {
        const statusNames = {
            [grpc_js_1.status.OK]: 'OK',
            [grpc_js_1.status.CANCELLED]: 'CANCELLED',
            [grpc_js_1.status.UNKNOWN]: 'UNKNOWN',
            [grpc_js_1.status.INVALID_ARGUMENT]: 'INVALID_ARGUMENT',
            [grpc_js_1.status.DEADLINE_EXCEEDED]: 'DEADLINE_EXCEEDED',
            [grpc_js_1.status.NOT_FOUND]: 'NOT_FOUND',
            [grpc_js_1.status.ALREADY_EXISTS]: 'ALREADY_EXISTS',
            [grpc_js_1.status.PERMISSION_DENIED]: 'PERMISSION_DENIED',
            [grpc_js_1.status.RESOURCE_EXHAUSTED]: 'RESOURCE_EXHAUSTED',
            [grpc_js_1.status.FAILED_PRECONDITION]: 'FAILED_PRECONDITION',
            [grpc_js_1.status.ABORTED]: 'ABORTED',
            [grpc_js_1.status.OUT_OF_RANGE]: 'OUT_OF_RANGE',
            [grpc_js_1.status.UNIMPLEMENTED]: 'UNIMPLEMENTED',
            [grpc_js_1.status.INTERNAL]: 'INTERNAL',
            [grpc_js_1.status.UNAVAILABLE]: 'UNAVAILABLE',
            [grpc_js_1.status.DATA_LOSS]: 'DATA_LOSS',
            [grpc_js_1.status.UNAUTHENTICATED]: 'UNAUTHENTICATED',
        };
        return statusNames[code] || 'UNKNOWN';
    }
};
exports.GrpcExceptionFilter = GrpcExceptionFilter;
exports.GrpcExceptionFilter = GrpcExceptionFilter = GrpcExceptionFilter_1 = tslib_1.__decorate([
    (0, common_1.Catch)()
], GrpcExceptionFilter);
//# sourceMappingURL=grpc-exception.filter.js.map