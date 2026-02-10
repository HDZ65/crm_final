"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthInterceptor = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const jose_1 = require("jose");
let AuthInterceptor = class AuthInterceptor {
    async intercept(context, next) {
        if (this.isPublicEndpoint(context)) {
            return next.handle();
        }
        const metadata = context.getArgByIndex(1);
        if (this.isInternalCall(metadata)) {
            return next.handle();
        }
        const authHeader = this.extractAuthorization(metadata);
        if (!authHeader) {
            throw new common_1.UnauthorizedException("Missing auth token");
        }
        const token = authHeader.replace(/^Bearer\s+/i, "").trim();
        if (!token) {
            throw new common_1.UnauthorizedException("Missing auth token");
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new common_1.UnauthorizedException("JWT secret not configured");
        }
        const { payload } = await (0, jose_1.jwtVerify)(token, new TextEncoder().encode(secret));
        const userId = this.extractUserId(payload);
        const rpcContext = context.switchToRpc().getContext();
        if (rpcContext) {
            rpcContext.user = payload;
            if (userId) {
                rpcContext.userId = userId;
            }
        }
        return next.handle();
    }
    extractAuthorization(metadata) {
        if (!metadata || typeof metadata.get !== "function") {
            return undefined;
        }
        const values = metadata.get("authorization");
        if (!Array.isArray(values) || values.length === 0) {
            return undefined;
        }
        const rawValue = values[0];
        if (Buffer.isBuffer(rawValue)) {
            return rawValue.toString("utf8");
        }
        if (typeof rawValue === "string") {
            return rawValue;
        }
        return undefined;
    }
    isInternalCall(metadata) {
        if (!metadata || typeof metadata.get !== "function") {
            return false;
        }
        const values = metadata.get("x-internal-service");
        if (!Array.isArray(values) || values.length === 0) {
            return false;
        }
        const rawValue = values[0];
        if (Buffer.isBuffer(rawValue)) {
            return rawValue.toString("utf8").trim().length > 0;
        }
        if (typeof rawValue === "string") {
            return rawValue.trim().length > 0;
        }
        return false;
    }
    extractUserId(payload) {
        const candidate = payload.sub ??
            payload.userId ??
            payload.user_id ??
            payload.id;
        if (typeof candidate === "string" && candidate.length > 0) {
            return candidate;
        }
        return undefined;
    }
    isPublicEndpoint(context) {
        const handlerName = context.getHandler().name?.toLowerCase?.() ?? "";
        const className = context.getClass().name?.toLowerCase?.() ?? "";
        const rpcContext = context.switchToRpc().getContext();
        const path = typeof rpcContext?.getPath === "function"
            ? rpcContext.getPath()
            : typeof rpcContext?.method === "string"
                ? rpcContext.method
                : undefined;
        const pathValue = typeof path === "string" ? path.toLowerCase() : "";
        const publicMarkers = [
            "health",
            "live",
            "ready",
            "readiness",
            "liveness",
            "ping",
        ];
        if (pathValue.includes("grpc.health.v1.health")) {
            return true;
        }
        return publicMarkers.some((marker) => handlerName.includes(marker) ||
            className.includes(marker) ||
            pathValue.includes(marker));
    }
};
exports.AuthInterceptor = AuthInterceptor;
exports.AuthInterceptor = AuthInterceptor = tslib_1.__decorate([
    (0, common_1.Injectable)()
], AuthInterceptor);
//# sourceMappingURL=auth.interceptor.js.map