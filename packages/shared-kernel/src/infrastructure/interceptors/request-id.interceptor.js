"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestIdInterceptor = exports.USER_ID_KEY = exports.REQUEST_ID_KEY = exports.REQUEST_ID_HEADER = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
exports.REQUEST_ID_HEADER = 'x-request-id';
exports.REQUEST_ID_KEY = 'requestId';
exports.USER_ID_KEY = 'userId';
let RequestIdInterceptor = class RequestIdInterceptor {
    intercept(context, next) {
        const type = context.getType();
        let requestId;
        let userId;
        if (type === 'http') {
            const request = context.switchToHttp().getRequest();
            requestId = request.headers[exports.REQUEST_ID_HEADER] || (0, crypto_1.randomUUID)();
            userId = this.extractUserIdFromHttpRequest(request);
            request[exports.REQUEST_ID_KEY] = { requestId, userId };
            const response = context.switchToHttp().getResponse();
            response.setHeader(exports.REQUEST_ID_HEADER, requestId);
        }
        else if (type === 'rpc') {
            const rpcContext = context.switchToRpc();
            const metadata = rpcContext.getContext();
            requestId = metadata?.[exports.REQUEST_ID_HEADER] || (0, crypto_1.randomUUID)();
            userId = this.extractUserIdFromRpcContext(rpcContext);
            if (metadata) {
                metadata[exports.REQUEST_ID_KEY] = { requestId, userId };
            }
        }
        else {
            requestId = (0, crypto_1.randomUUID)();
            userId = undefined;
        }
        context.switchToHttp().getRequest()[exports.REQUEST_ID_KEY] = { requestId, userId };
        return next.handle();
    }
    extractUserIdFromHttpRequest(request) {
        return request?.query?.userId ||
            request?.body?.userId ||
            request?.headers?.['x-user-id'] ||
            request?.user?.id ||
            request?.['userId'] ||
            undefined;
    }
    extractUserIdFromRpcContext(rpcContext) {
        const data = rpcContext.getData();
        return data?.userId ||
            data?.initiatedBy ||
            data?.ownerId ||
            data?.callerId ||
            undefined;
    }
};
exports.RequestIdInterceptor = RequestIdInterceptor;
exports.RequestIdInterceptor = RequestIdInterceptor = tslib_1.__decorate([
    (0, common_1.Injectable)()
], RequestIdInterceptor);
//# sourceMappingURL=request-id.interceptor.js.map