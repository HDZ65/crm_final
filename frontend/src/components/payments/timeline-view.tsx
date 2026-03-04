"use client"

import * as React from "react"
import { CalendarEmptyState } from "@/components/payments/empty-states"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type {
  DebitLot,
  DebitCalendarDay,
} from "@/lib/ui/display-types/payment"
import { cn } from "@/lib/utils"

interface TimelineViewProps {
  lots: DebitLot[]
  payments: DebitCalendarDay[]
  currentMonth: number
  currentYear: number
}

// ---------- helpers ----------

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

type BlockStatus = "succeeded" | "pending" | "failed" | "planned"

const statusColors: Record<BlockStatus, string> = {
  succeeded:
    "bg-emerald-500/80 hover:bg-emerald-500 ring-emerald-500/25",
  pending: "bg-blue-500/80 hover:bg-blue-500 ring-blue-500/25",
  failed: "bg-red-500/80 hover:bg-red-500 ring-red-500/25",
  planned:
    "bg-muted-foreground/30 hover:bg-muted-foreground/40 ring-muted-foreground/15",
}

const statusLabels: Record<BlockStatus, string> = {
  succeeded: "Traité",
  pending: "En cours",
  failed: "Rejeté",
  planned: "Planifié",
}

function deriveStatus(day: DebitCalendarDay): BlockStatus {
  if (day.actual_count != null && day.actual_count > 0) {
    return "succeeded"
  }
  if (day.planned_count > 0) {
    return "planned"
  }
  return "planned"
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ---------- component ----------

export function TimelineView({
  lots,
  payments,
  currentMonth,
  currentYear,
}: TimelineViewProps) {
  // Empty-state guard
  if (lots.length === 0 || payments.length === 0) {
    return <CalendarEmptyState />
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Group payments by lotId → day_of_month
  const paymentsByLot = React.useMemo(() => {
    const map = new Map<string, Map<number, DebitCalendarDay>>()
    for (const p of payments) {
      if (!p.lotId) continue
      if (!map.has(p.lotId)) {
        map.set(p.lotId, new Map())
      }
      map.get(p.lotId)!.set(p.day_of_month, p)
    }
    return map
  }, [payments])

  // Sort lots by displayOrder
  const sortedLots = React.useMemo(
    () => [...lots].sort((a, b) => a.displayOrder - b.displayOrder),
    [lots]
  )

  const dayColWidth = 44
  const lotLabelWidth = 128

  return (
    <TooltipProvider delayDuration={150}>
      <div className="overflow-x-auto rounded-lg border bg-background">
        <div
          className="min-w-max"
          style={{
            display: "grid",
            gridTemplateColumns: `${lotLabelWidth}px repeat(${daysInMonth}, ${dayColWidth}px)`,
          }}
        >
          {/* ── Header row: corner + day numbers ── */}
          <div className="sticky left-0 z-10 border-b border-r bg-muted/60 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Lot
          </div>
          {dayNumbers.map((day) => {
            const isWeekend = [0, 6].includes(
              new Date(currentYear, currentMonth - 1, day).getDay()
            )
            return (
              <div
                key={day}
                className={cn(
                  "border-b border-r py-2.5 text-center text-[11px] font-semibold tabular-nums",
                  isWeekend
                    ? "bg-muted/30 text-muted-foreground/50"
                    : "bg-muted/60 text-muted-foreground"
                )}
              >
                {day}
              </div>
            )
          })}

          {/* ── Lot lanes ── */}
          {sortedLots.map((lot, lotIdx) => {
            const lotPayments = paymentsByLot.get(lot.id)
            const isLast = lotIdx === sortedLots.length - 1

            return (
              <React.Fragment key={lot.id}>
                {/* Lot label (sticky) */}
                <div
                  className={cn(
                    "sticky left-0 z-10 flex items-center border-r bg-background px-3 py-2",
                    !isLast && "border-b"
                  )}
                >
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="truncate text-xs font-medium">
                      {lot.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      J{lot.startDay}–J{lot.endDay}
                    </span>
                  </div>
                </div>

                {/* Day cells */}
                {dayNumbers.map((day) => {
                  const entry = lotPayments?.get(day)
                  const isWeekend = [0, 6].includes(
                    new Date(currentYear, currentMonth - 1, day).getDay()
                  )
                  const inRange = day >= lot.startDay && day <= lot.endDay

                  return (
                    <div
                      key={day}
                      className={cn(
                        "flex min-h-[52px] items-center justify-center border-r px-0.5 py-1",
                        !isLast && "border-b",
                        isWeekend && "bg-muted/5",
                        inRange && !entry && "bg-primary/[0.02]"
                      )}
                    >
                      {entry && entry.planned_count > 0 && (
                        <PaymentBlock
                          entry={entry}
                          lotName={lot.name}
                          day={day}
                        />
                      )}
                    </div>
                  )
                })}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}

// ---------- sub-component ----------

function PaymentBlock({
  entry,
  lotName,
  day,
}: {
  entry: DebitCalendarDay
  lotName: string
  day: number
}) {
  const status = deriveStatus(entry)
  const pspEntries = Object.entries(entry.psp_distribution)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full cursor-default rounded-sm px-1 py-1 text-white ring-1 ring-inset transition-colors",
            statusColors[status]
          )}
        >
          <div className="truncate text-[10px] font-semibold leading-tight">
            {entry.planned_count}
          </div>
          <div className="truncate text-[9px] leading-tight opacity-80">
            {formatAmount(entry.planned_amount)}
          </div>
        </button>
      </TooltipTrigger>

      <TooltipContent side="top" className="max-w-[240px] space-y-1.5 p-3">
        {/* Lot + day */}
        <p className="font-semibold leading-none">
          {lotName} — Jour {day}
        </p>

        {/* Status */}
        <p className="text-[11px] opacity-80">{statusLabels[status]}</p>

        {/* Amounts */}
        <div className="space-y-0.5 text-[11px]">
          <p>
            {entry.planned_count} prélèvement
            {entry.planned_count > 1 ? "s" : ""} ·{" "}
            {formatAmount(entry.planned_amount)}
          </p>
          {entry.actual_count != null && (
            <p>
              Réalisé : {entry.actual_count} ·{" "}
              {formatAmount(entry.actual_amount ?? 0)}
            </p>
          )}
        </div>

        {/* PSP distribution */}
        {pspEntries.length > 0 && (
          <div className="space-y-0.5 border-t border-white/20 pt-1.5 text-[11px]">
            {pspEntries.map(([psp, count]) => (
              <p key={psp}>
                {psp} : {count}
              </p>
            ))}
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
