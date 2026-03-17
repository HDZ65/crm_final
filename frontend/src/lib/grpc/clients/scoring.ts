import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, type GrpcClient } from "./config";
import {
  ScoringServiceService,
  type PredictRiskRequest,
  type PredictRiskResponse,
} from "@proto/scoring/scoring";

let scoringInstance: GrpcClient | null = null;

function getScoringClient(): GrpcClient {
  if (!scoringInstance) {
    scoringInstance = makeClient(
      ScoringServiceService,
      "ScoringService",
      SERVICES.scoring,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return scoringInstance;
}

export const scoring = {
  predictRisk: (request: PredictRiskRequest): Promise<PredictRiskResponse> =>
    promisify<PredictRiskRequest, PredictRiskResponse>(
      getScoringClient(),
      "predictRisk"
    )(request),
};

export type { PredictRiskRequest, PredictRiskResponse };
