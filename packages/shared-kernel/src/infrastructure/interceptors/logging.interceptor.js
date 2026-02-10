"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const logger_service_js_1 = require("../logging/logger.service.js");
const request_id_interceptor_js_1 = require("./request-id.interceptor.js");
let LoggingInterceptor = class LoggingInterceptor {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    intercept(context, next) {
        const now = Date.now();
        const type = context.getType();
        const handler = context.getHandler().name;
        const className = context.getClass().name;
        let requestId;
        let userId;
        let method;
        let url;
        if (type === 'http') {
            const request = context.switchToHttp().getRequest();
            const requestContext = request[request_id_interceptor_js_1.REQUEST_ID_KEY];
            requestId = typeof requestContext === 'string' ? requestContext : requestContext?.requestId;
            method = request.method;
            url = request.url;
            userId = typeof requestContext === 'string' ? undefined : requestContext?.userId;
            this.logger.setRequestId(requestId);
            this.logger.log(`Incoming Request: ${method} ${url}`, {
                requestId,
                userId,
                handler: `${className}.${handler}`,
            });
        }
        else if (type === 'rpc') {
            const rpcContext = context.switchToRpc();
            const metadata = rpcContext.getContext();
            const requestContext = metadata?.[request_id_interceptor_js_1.REQUEST_ID_KEY];
            requestId = typeof requestContext === 'string' ? requestContext : requestContext?.requestId;
            method = handler;
            userId = typeof requestContext === 'string' ? undefined : requestContext?.userId;
            this.logger.setRequestId(requestId);
            this.logger.log(`Incoming gRPC Call: ${method}`, {
                requestId,
                userId,
                handler: `${className}.${handler}`,
            });
        }
        return next.handle().pipe((0, operators_1.tap)({
            next: () => {
                const duration = Date.now() - now;
                this.logger.log(`Request completed`, {
                    requestId,
                    userId,
                    duration,
                    handler: `${className}.${handler}`,
                });
            },
            error: (error) => {
                const duration = Date.now() - now;
                this.logger.error(`Request failed`, error.stack, {
                    requestId,
                    userId,
                    duration,
                    handler: `${className}.${handler}`,
                    error: error.message,
                });
            },
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [logger_service_js_1.AppLoggerService])
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map