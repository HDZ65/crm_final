"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { CalendarEmptyState } from "@/components/payments/empty-states"
import { TimelineView } from "@/components/payments/timeline-view"
import { KanbanView } from "@/components/payments/kanban-view"
import {
  AlignLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
} from "lucide-react"

interface CalendrierViewProps {
  societeId: string
}

export function CalendrierView({ societeId }: CalendrierViewProps) {
  const [activeView, setActiveView] = React.useState<
    "mensuel" | "timeline" | "kanban"
  >("mensuel")
  const [currentMonth, setCurrentMonth] = React.useState(
    new Date().getMonth() + 1
  )
  const [currentYear, setCurrentYear] = React.useState(new Date().getFullYear())

  // TODO: Fetch calendar data from backend
  const hasData = false

  const monthName = new Date(currentYear, currentMonth - 1).toLocaleDateString(
    "fr-FR",
    { month: "long", year: "numeric" }
  )

  const handlePreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={activeView === "mensuel" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveView("mensuel")}
          className="gap-2"
        >
          <CalendarDays className="h-4 w-4" />
          Mensuel
        </Button>
        <Button
          variant={activeView === "timeline" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveView("timeline")}
          className="gap-2"
        >
          <AlignLeft className="h-4 w-4" />
          Timeline
        </Button>
        <Button
          variant={activeView === "kanban" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveView("kanban")}
          className="gap-2"
        >
          <LayoutGrid className="h-4 w-4" />
          Kanban
        </Button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePreviousMonth}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium capitalize">{monthName}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* View Content */}
      {activeView === "mensuel" && (
        <>
          {hasData ? (
            <div className="rounded-lg border p-4">
              {/* Calendar grid will be integrated here */}
              <div className="text-center text-muted-foreground">
                Calendrier mensuel — {monthName}
              </div>
            </div>
          ) : (
            <CalendarEmptyState />
          )}
        </>
      )}

      {activeView === "timeline" && (
        <TimelineView
          lots={[]}
          payments={[]}
          currentMonth={currentMonth}
          currentYear={currentYear}
        />
      )}

      {activeView === "kanban" && (
        <KanbanView lots={[]} payments={[]} />
      )}
    </div>
  )
}
