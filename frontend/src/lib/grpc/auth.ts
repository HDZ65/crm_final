import { getServerAuth } from "@/lib/auth.server";

// Use require to bypass ESM bundling issues
// eslint-disable-next-line @typescript-eslint/no-require-imports
const grpc = require("@grpc/grpc-js");

type MetadataGenerator = (
  params: unknown,
  callback: (error: Error | null, metadata: import("@grpc/grpc-js").Metadata) => void
) => void;

export function createAuthMetadata(token?: string): import("@grpc/grpc-js").Metadata {
  const metadata = new grpc.Metadata();
  if (token) {
    metadata.add("authorization", `Bearer ${token}`);
  }
  return metadata;
}

export function createAuthMetadataGenerator(): MetadataGenerator {
  return async (_params: unknown, callback) => {
    try {
      const session = await getServerAuth();
      const token = session?.accessToken;
      callback(null, createAuthMetadata(token));
    } catch (error) {
      callback(null, createAuthMetadata());
    }
  };
}

export function createAuthChannelCredentials(
  channelCredentials: import("@grpc/grpc-js").ChannelCredentials
): import("@grpc/grpc-js").ChannelCredentials {
  const callCredentials = grpc.credentials.createFromMetadataGenerator(
    createAuthMetadataGenerator()
  );

  return grpc.credentials.combineChannelCredentials(
    channelCredentials,
    callCredentials
  );
}
