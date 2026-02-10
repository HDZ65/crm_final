import { getServerAuth } from "@/lib/auth/auth.server";
import * as grpc from "@grpc/grpc-js";

export function createAuthMetadata(token?: string): grpc.Metadata {
  const metadata = new grpc.Metadata();
  if (token) {
    metadata.add("authorization", `Bearer ${token}`);
  }
  return metadata;
}

/**
 * Create channel credentials that work in both dev (insecure) and prod (TLS).
 * grpc-js cannot combine insecure channel creds with call creds,
 * so in dev we just return insecure creds and inject auth metadata per-call.
 */
export function createAuthChannelCredentials(
  channelCredentials: grpc.ChannelCredentials
): grpc.ChannelCredentials {
  return channelCredentials;
}

/**
 * Get auth metadata for the current server session.
 * Call this before each gRPC call to inject the Bearer token.
 */
export async function getAuthMetadata(): Promise<grpc.Metadata> {
  try {
    const session = await getServerAuth();
    return createAuthMetadata(session?.accessToken);
  } catch {
    return createAuthMetadata();
  }
}
