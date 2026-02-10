import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from "@nestjs/common";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import type { JWTPayload } from "jose";
import { jwtVerify } from "jose";

@Injectable()
export class AuthInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    if (this.isPublicEndpoint(context)) {
      return next.handle();
    }

    const metadata = context.getArgByIndex(1);
    if (this.isInternalCall(metadata)) {
      return next.handle();
    }
    const authHeader = this.extractAuthorization(metadata);

    if (!authHeader) {
      throw new UnauthorizedException("Missing auth token");
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      throw new UnauthorizedException("Missing auth token");
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new UnauthorizedException("JWT secret not configured");
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );
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

  private extractAuthorization(metadata: {
    get?: (key: string) => unknown[];
  }): string | undefined {
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

  private isInternalCall(metadata: {
    get?: (key: string) => unknown[];
  }): boolean {
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

  private extractUserId(payload: JWTPayload): string | undefined {
    const candidate =
      payload.sub ??
      (payload as { userId?: string }).userId ??
      (payload as { user_id?: string }).user_id ??
      (payload as { id?: string }).id;

    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }

    return undefined;
  }

  private isPublicEndpoint(context: ExecutionContext): boolean {
    const handlerName = context.getHandler().name?.toLowerCase?.() ?? "";
    const className = context.getClass().name?.toLowerCase?.() ?? "";
    const rpcContext = context.switchToRpc().getContext();
    const path =
      typeof rpcContext?.getPath === "function"
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

    return publicMarkers.some(
      (marker) =>
        handlerName.includes(marker) ||
        className.includes(marker) ||
        pathValue.includes(marker),
    );
  }
}
