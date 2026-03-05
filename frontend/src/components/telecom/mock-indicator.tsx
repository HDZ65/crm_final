"use client"

import { Badge } from "@/components/ui/badge"

const isMock = process.env.NEXT_PUBLIC_TELECOM_TRANSATEL_MOCK === "true"

export function MockIndicator() {
  if (!isMock) return null
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
      </span>
      <Badge variant="outline" className="border-amber-400 text-amber-600 bg-amber-50 text-xs font-semibold">
        SIMULATION
      </Badge>
    </span>
  )
}
