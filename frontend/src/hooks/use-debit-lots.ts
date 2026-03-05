"use client"

import { useState } from "react"
import type { DebitLot } from "@/lib/ui/display-types/payment"

/**
 * Shared hook to fetch debit lots for a given société.
 * Stub — returns empty array until gRPC integration.
 */
export function useDebitLots(societeId: string): { lots: DebitLot[]; isLoading: boolean } {
  // TODO: Replace with gRPC ListLots call using societeId
  const [lots] = useState<DebitLot[]>([])
  const [isLoading] = useState(false)

  return { lots, isLoading }
}
