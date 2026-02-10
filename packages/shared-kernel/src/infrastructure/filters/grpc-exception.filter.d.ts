import { RpcExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare class GrpcExceptionFilter implements RpcExceptionFilter<Error> {
    private readonly logger;
    catch(exception: Error, host: ArgumentsHost): Observable<any>;
    private getGrpcStatus;
    private getErrorDetails;
    private logException;
    private isClientError;
    private getStatusName;
}
//# sourceMappingURL=grpc-exception.filter.d.ts.map