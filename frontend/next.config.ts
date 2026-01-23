import type { NextConfig } from "next";
const nextConfig: NextConfig =
{
  output: "standalone",
  serverExternalPackages: ["consul", "@grpc/grpc-js", "@grpc/proto-loader"],
};
export default nextConfig;