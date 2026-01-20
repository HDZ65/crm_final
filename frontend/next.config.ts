import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false, // Désactivé pour éviter les double-renders en dev
  // Exclude gRPC and native Node.js modules from bundling
  serverExternalPackages: [
    "@grpc/grpc-js",
    "@grpc/proto-loader",
    "@connectrpc/connect",
    "@connectrpc/connect-node",
    "google-auth-library",
    "protobufjs",
  ],
};

export default nextConfig;
