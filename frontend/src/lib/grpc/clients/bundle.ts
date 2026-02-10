/**
 * Bundle Service gRPC Client
 */

import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, GrpcClient } from "./config";
import {
  BundleSvcService,
  type GetConfigurationRequest,
  type GetConfigurationResponse,
  type ListConfigurationsRequest,
  type ListConfigurationsResponse,
  type BundleCalculatePriceRequest,
  type BundleCalculatePriceResponse,
} from "@proto/services/bundle";

let bundleInstance: GrpcClient | null = null;

function getBundleClient(): GrpcClient {
  if (!bundleInstance) {
    bundleInstance = makeClient(
      BundleSvcService,
      "BundleSvc",
      SERVICES.bundle,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return bundleInstance;
}

export const bundle = {
  getConfiguration: (request: GetConfigurationRequest): Promise<GetConfigurationResponse> =>
    promisify<GetConfigurationRequest, GetConfigurationResponse>(
      getBundleClient(),
      "getConfiguration"
    )(request),

  listConfigurations: (request: ListConfigurationsRequest): Promise<ListConfigurationsResponse> =>
    promisify<ListConfigurationsRequest, ListConfigurationsResponse>(
      getBundleClient(),
      "listConfigurations"
    )(request),

  calculatePrice: (request: BundleCalculatePriceRequest): Promise<BundleCalculatePriceResponse> =>
    promisify<BundleCalculatePriceRequest, BundleCalculatePriceResponse>(
      getBundleClient(),
      "calculatePrice"
    )(request),
};

// Re-export types for convenience
export type {
  GetConfigurationRequest,
  GetConfigurationResponse,
  ListConfigurationsRequest,
  ListConfigurationsResponse,
  BundleCalculatePriceRequest,
  BundleCalculatePriceResponse,
};
