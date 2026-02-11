/**
 * WinLeadPlus Service gRPC Client
 */

import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, GrpcClient } from "./config";
import {
  WinLeadPlusSyncServiceService,
  type SyncProspectsRequest,
  type SyncProspectsResponse,
  type GetSyncStatusRequest,
  type GetSyncStatusResponse,
  type ListWinLeadPlusSyncLogsRequest,
  type ListWinLeadPlusSyncLogsResponse,
  type TestConnectionRequest,
  type TestConnectionResponse as WinLeadPlusTestConnectionResponse,
} from "@proto/winleadplus/winleadplus";

let syncServiceInstance: GrpcClient | null = null;

function getSyncServiceClient(): GrpcClient {
  if (!syncServiceInstance) {
    syncServiceInstance = makeClient(
      WinLeadPlusSyncServiceService,
      "WinLeadPlusSyncService",
      SERVICES.winleadplus,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return syncServiceInstance;
}

export const winleadplus = {
  syncProspects: (request: SyncProspectsRequest): Promise<SyncProspectsResponse> =>
    promisify<SyncProspectsRequest, SyncProspectsResponse>(
      getSyncServiceClient(),
      "syncProspects"
    )(request),

  getSyncStatus: (request: GetSyncStatusRequest): Promise<GetSyncStatusResponse> =>
    promisify<GetSyncStatusRequest, GetSyncStatusResponse>(
      getSyncServiceClient(),
      "getSyncStatus"
    )(request),

  getSyncLogs: (request: ListWinLeadPlusSyncLogsRequest): Promise<ListWinLeadPlusSyncLogsResponse> =>
    promisify<ListWinLeadPlusSyncLogsRequest, ListWinLeadPlusSyncLogsResponse>(
      getSyncServiceClient(),
      "getSyncLogs"
    )(request),

  testConnection: (request: TestConnectionRequest): Promise<WinLeadPlusTestConnectionResponse> =>
    promisify<TestConnectionRequest, WinLeadPlusTestConnectionResponse>(
      getSyncServiceClient(),
      "testConnection"
    )(request),
};

// Re-export types for convenience
export type {
  SyncProspectsRequest,
  SyncProspectsResponse,
  GetSyncStatusRequest,
  GetSyncStatusResponse,
  ListWinLeadPlusSyncLogsRequest,
  ListWinLeadPlusSyncLogsResponse,
  TestConnectionRequest,
};
export type { WinLeadPlusTestConnectionResponse as TestConnectionResponse };
