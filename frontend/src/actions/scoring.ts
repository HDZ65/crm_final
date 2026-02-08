"use server"

/**
 * REST EXCEPTION — Python FastAPI Scoring Service
 *
 * This server action intentionally uses REST (fetch) instead of gRPC because:
 * 1. The scoring service is implemented in Python with FastAPI (not NestJS)
 * 2. Python service runs on port 8001 with REST endpoints
 * 3. Migrating Python ML service to NestJS/gRPC would require complete rewrite
 * 4. REST is appropriate for cross-language service integration
 *
 * Documented exception in the REST→gRPC migration (Wave 3 Task 8).
 * Service endpoint: POST http://localhost:8001/predict
 */

import { z, type ZodIssue } from "zod"

// Request schema matching Python FastAPI PredictRequest
const PredictRequestSchema = z.object({
  prev_rejects: z.number().int().min(0),
  channel: z.string().min(1),
  contract_age_months: z.number().int().min(0),
  payment_history_count: z.number().int().min(0),
  lot_code: z.string().min(1),
  provider: z.string().min(1),
  amount_cents: z.number().int().min(0),
  preferred_debit_day: z.number().int().min(1).max(31),
})

// Response schema matching Python FastAPI PredictResponse
const PredictResponseSchema = z.object({
  score: z.number().int().min(0).max(100),
  risk_tier: z.enum(["LOW", "MEDIUM", "HIGH"]),
  factors: z.record(z.string(), z.number()),
})

export type PredictRequest = z.infer<typeof PredictRequestSchema>
export type PredictResponse = z.infer<typeof PredictResponseSchema>

export interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Call Python scoring service to predict payment risk
 * @param request Payment data for scoring
 * @returns Risk score, tier, and contributing factors
 */
export async function predictPaymentRisk(
  request: PredictRequest
): Promise<ActionResult<PredictResponse>> {
  try {
    // Validate request
    const validatedRequest = PredictRequestSchema.safeParse(request)
    if (!validatedRequest.success) {
      return {
        success: false,
        error: `Validation error: ${validatedRequest.error.issues.map((e: ZodIssue) => e.message).join(", ")}`,
      }
    }

    // Call Python FastAPI service
    const scoringServiceUrl =
      process.env.SCORING_SERVICE_URL || "http://localhost:8001"
    const response = await fetch(`${scoringServiceUrl}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validatedRequest.data),
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: `Scoring service error: ${response.status} - ${errorText}`,
      }
    }

    const data = await response.json()

    // Validate response
    const validatedResponse = PredictResponseSchema.safeParse(data)
    if (!validatedResponse.success) {
      return {
        success: false,
        error: `Invalid response from scoring service: ${validatedResponse.error.issues.map((e: ZodIssue) => e.message).join(", ")}`,
      }
    }

    return {
      success: true,
      data: validatedResponse.data,
    }
  } catch (error) {

    if (error instanceof Error) {
      // Handle timeout
      if (error.name === "TimeoutError" || error.name === "AbortError") {
        return {
          success: false,
          error: "Scoring service timeout - service may be unavailable",
        }
      }

      // Handle network errors
      if (error.message.includes("fetch")) {
        return {
          success: false,
          error: "Cannot connect to scoring service - ensure service is running on port 8001",
        }
      }

      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: "Unknown error occurred",
    }
  }
}
