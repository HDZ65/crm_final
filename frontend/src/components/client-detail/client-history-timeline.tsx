"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, Clock } from "lucide-react"
import type { EventItem } from "@/types/client"

interface ClientHistoryTimelineProps {
  contractRef: string
  history: EventItem[]
}

export function ClientHistoryTimeline({
  contractRef,
  history,
}: ClientHistoryTimelineProps) {
  return (
    <Card className="h-96 2xl:h-[35rem] bg-gradient-to-br from-sky-50 to-sky-100 border-sky-200">
      <CardHeader>
        <div>
          <CardTitle className="text-lg flex items-center gap-2 text-sky-950">
            <History className="size-5" />
            Historique — {contractRef}
          </CardTitle>
          <p className="text-sm text-slate-600 mt-1">
            Chronologie des événements du contrat
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <ul className="space-y-5">
            {history.map((item, i) => (
              <li key={i} className="flex items-start gap-3 relative">
                <div className="mt-0.5 rounded-full bg-sky-500 text-white p-2 shadow-sm z-10">
                  {item.icon ? <item.icon className="size-4" /> : <Clock className="size-4" />}
                </div>
                {i < history.length - 1 && (
                  <div className="absolute left-[18px] top-10 w-0.5 h-[calc(100%+8px)] bg-sky-200" />
                )}
                <div className="flex-1 pt-1">
                  <div className="text-slate-900 font-medium">{item.label}</div>
                  <div className="text-slate-600 text-sm flex items-center gap-1.5 mt-0.5">
                    <span>{item.date}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
