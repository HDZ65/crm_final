"use server";

import { calendarEngine } from "@/lib/grpc";
import type {
  CalculatePlannedDateResponse,
  CheckDateEligibilityResponse,
  ResolvedDebitConfiguration,
} from "@proto/calendar/calendar";
import type { ActionResult } from "@/lib/types/common";

function mapResolvedConfig(config: {
  appliedLevel: number;
  appliedConfigId: string;
  mode: number;
  batch: number;
  fixedDay: number;
  shiftStrategy: number;
  holidayZoneId: string;
  cutoffConfigId: string;
}): ResolvedDebitConfiguration {
  return {
    appliedLevel: config.appliedLevel,
    appliedConfigId: config.appliedConfigId,
    mode: config.mode,
    batch: config.batch,
    fixedDay: config.fixedDay,
    shiftStrategy: config.shiftStrategy,
    holidayZoneId: config.holidayZoneId,
    cutoffConfigId: config.cutoffConfigId,
  };
}

export async function calculatePlannedDate(input: {
  organisationId: string;
  contratId?: string;
  clientId?: string;
  societeId?: string;
  referenceDate?: string;
  targetMonth: number;
  targetYear: number;
  includeResolutionTrace?: boolean;
}): Promise<ActionResult<CalculatePlannedDateResponse>> {
  try {
    const response = await calendarEngine.calculatePlannedDate({
      organisationId: input.organisationId,
      contratId: input.contratId || "",
      clientId: input.clientId || "",
      societeId: input.societeId || "",
      referenceDate: input.referenceDate || "",
      targetMonth: input.targetMonth,
      targetYear: input.targetYear,
      includeResolutionTrace: input.includeResolutionTrace || false,
    });

    return {
      data: {
        plannedDebitDate: response.plannedDebitDate,
        originalTargetDate: response.originalTargetDate,
        wasShifted: response.wasShifted,
        shiftReason: response.shiftReason,
        resolvedConfig: response.resolvedConfig
          ? mapResolvedConfig(response.resolvedConfig)
          : {
              appliedLevel: 0,
              appliedConfigId: "",
              mode: 0,
              batch: 0,
              fixedDay: 0,
              shiftStrategy: 0,
              holidayZoneId: "",
              cutoffConfigId: "",
            },
        resolutionTrace: response.resolutionTrace || [],
      },
      error: null,
    };
  } catch (err) {
    console.error("[calculatePlannedDate] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du calcul de la date de prélèvement",
    };
  }
}

export interface BatchCalculationInput {
  contratId: string;
  clientId?: string;
  societeId?: string;
  amountCents?: number;
  currency?: string;
}

export interface BatchCalculationResult {
  contratId: string;
  success: boolean;
  plannedDebitDate?: string;
  errorCode?: string;
  errorMessage?: string;
  resolvedConfig?: ResolvedDebitConfiguration;
}

export async function calculatePlannedDatesBatch(input: {
  organisationId: string;
  inputs: BatchCalculationInput[];
  targetMonth: number;
  targetYear: number;
}): Promise<
  ActionResult<{
    results: BatchCalculationResult[];
    totalCount: number;
    successCount: number;
    errorCount: number;
  }>
> {
  try {
    const response = await calendarEngine.calculatePlannedDatesBatch({
      organisationId: input.organisationId,
      inputs: input.inputs.map((i) => ({
        contratId: i.contratId,
        clientId: i.clientId || "",
        societeId: i.societeId || "",
        amountCents: i.amountCents || 0,
        currency: i.currency || "EUR",
      })),
      targetMonth: input.targetMonth,
      targetYear: input.targetYear,
    });

    return {
      data: {
        results: response.results.map((r) => ({
          contratId: r.contratId,
          success: r.success,
          plannedDebitDate: r.plannedDebitDate,
          errorCode: r.errorCode,
          errorMessage: r.errorMessage,
          resolvedConfig: r.resolvedConfig
            ? mapResolvedConfig(r.resolvedConfig)
            : undefined,
        })),
        totalCount: response.totalCount,
        successCount: response.successCount,
        errorCount: response.errorCount,
      },
      error: null,
    };
  } catch (err) {
    console.error("[calculatePlannedDatesBatch] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du calcul en lot des dates de prélèvement",
    };
  }
}

export async function checkDateEligibility(input: {
  organisationId: string;
  date: string;
  holidayZoneId: string;
}): Promise<ActionResult<CheckDateEligibilityResponse>> {
  try {
    const response = await calendarEngine.checkDateEligibility({
      organisationId: input.organisationId,
      date: input.date,
      holidayZoneId: input.holidayZoneId,
    });

    return {
      data: {
        isEligible: response.isEligible,
        isWeekend: response.isWeekend,
        isHoliday: response.isHoliday,
        holidayName: response.holidayName,
        nextEligibleDate: response.nextEligibleDate,
        previousEligibleDate: response.previousEligibleDate,
      },
      error: null,
    };
  } catch (err) {
    console.error("[checkDateEligibility] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la vérification d'éligibilité de la date",
    };
  }
}
