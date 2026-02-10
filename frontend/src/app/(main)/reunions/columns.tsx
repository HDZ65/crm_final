"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CalendarDays,
  Clock,
  FileText,
  Loader2,
  MapPin,
  Pencil,
  Trash2,
  Users,
} from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CalendarEvent = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Meeting = any
type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

// --- Helpers (shared with agenda-page-client) ---

export function formatDateTime(value?: string) {
  if (!value) {
    return "-"
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "-"
  }
  return date.toLocaleString("fr-FR")
}

export const SUMMARY_STATUS_LABELS: Record<number, string> = {
  0: "Non défini",
  1: "En attente",
  2: "En traitement",
  3: "Terminé",
  4: "Échec",
  5: "Sans transcription",
}

export const SUMMARY_STATUS_VARIANTS: Record<number, BadgeVariant> = {
  0: "outline",
  1: "secondary",
  2: "secondary",
  3: "default",
  4: "destructive",
  5: "outline",
}

export function getSummaryStatus(status?: number) {
  const normalizedStatus = typeof status === "number" ? status : 0
  return {
    label: SUMMARY_STATUS_LABELS[normalizedStatus] ?? SUMMARY_STATUS_LABELS[0],
    variant: SUMMARY_STATUS_VARIANTS[normalizedStatus] ?? ("outline" as BadgeVariant),
  }
}

// --- Event Columns ---

interface EventColumnCallbacks {
  onEdit: (event: CalendarEvent) => void
  onDelete: (event: CalendarEvent) => void
}

export function createEventColumns({ onEdit, onDelete }: EventColumnCallbacks): ColumnDef<CalendarEvent>[] {
  return [
    {
      accessorKey: "title",
      header: () => (
        <div className="flex items-center gap-1.5">
          <CalendarDays className="size-4" />
          Titre
        </div>
      ),
      cell: ({ row }) => (
        <div className="font-medium text-slate-800">
          {row.original.title || "Sans titre"}
        </div>
      ),
    },
    {
      id: "startTime",
      header: () => (
        <div className="flex items-center gap-1.5">
          <Clock className="size-4" />
          Début
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-slate-700">
          {formatDateTime(row.original.start_time || row.original.startTime)}
        </div>
      ),
    },
    {
      id: "endTime",
      header: "Fin",
      cell: ({ row }) => (
        <div className="text-slate-700">
          {formatDateTime(row.original.end_time || row.original.endTime)}
        </div>
      ),
    },
    {
      accessorKey: "location",
      header: () => (
        <div className="flex items-center gap-1.5">
          <MapPin className="size-4" />
          Lieu
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-slate-700">{row.original.location || "-"}</div>
      ),
    },
    {
      id: "attendees",
      header: () => (
        <div className="flex items-center gap-1.5">
          <Users className="size-4" />
          Participants
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-slate-700">{row.original.attendees || "-"}</div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(row.original)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(row.original)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ]
}

// --- Meeting Columns ---

interface MeetingColumnCallbacks {
  onMatchParticipants: (meetingId: string) => void
  onShowSummary: (meetingId: string) => void
  matchingMeetingId: string | null
}

export function createMeetingColumns({
  onMatchParticipants,
  onShowSummary,
  matchingMeetingId,
}: MeetingColumnCallbacks): ColumnDef<Meeting>[] {
  return [
    {
      accessorKey: "title",
      header: () => (
        <div className="flex items-center gap-1.5">
          <CalendarDays className="size-4" />
          Titre
        </div>
      ),
      cell: ({ row }) => (
        <div className="font-medium text-slate-800">
          {row.original.title || "Sans titre"}
        </div>
      ),
    },
    {
      id: "startTime",
      header: () => (
        <div className="flex items-center gap-1.5">
          <Clock className="size-4" />
          Début
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-slate-700">
          {formatDateTime(row.original.start_time || row.original.startTime)}
        </div>
      ),
    },
    {
      id: "duration",
      header: "Durée",
      cell: ({ row }) => {
        const minutes = row.original.duration_minutes || row.original.durationMinutes
        return (
          <div className="text-slate-700">
            {minutes ? `${minutes} min` : "-"}
          </div>
        )
      },
    },
    {
      id: "participants",
      header: () => (
        <div className="flex items-center gap-1.5">
          <Users className="size-4" />
          Participants
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-slate-700">{row.original.participants || "-"}</div>
      ),
    },
    {
      id: "summaryStatus",
      header: "Statut résumé",
      cell: ({ row }) => {
        const status = getSummaryStatus(row.original.summary_status)
        return <Badge variant={status.variant}>{status.label}</Badge>
      },
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const isMatching = matchingMeetingId === row.original.id
        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMatchParticipants(row.original.id)}
              disabled={isMatching}
            >
              {isMatching ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Users className="mr-2 size-4" />
              )}
              Match participants
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShowSummary(row.original.id)}
            >
              <FileText className="mr-2 size-4" />
              Résumé
            </Button>
          </div>
        )
      },
    },
  ]
}

// --- Summary sidebar columns ---

interface SummaryColumnCallbacks {
  onLoadSummary: (meetingId: string) => void
  selectedMeetingId: string
}

export function createSummaryColumns({
  onLoadSummary,
  selectedMeetingId,
}: SummaryColumnCallbacks): ColumnDef<Meeting>[] {
  return [
    {
      accessorKey: "title",
      header: "Réunion",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.title || "Sans titre"}</div>
          <div className="text-xs text-muted-foreground">
            {formatDateTime(row.original.start_time || row.original.startTime)}
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => <div className="text-right">Action</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant={selectedMeetingId === row.original.id ? "default" : "outline"}
            size="sm"
            onClick={() => onLoadSummary(row.original.id)}
          >
            Ouvrir
          </Button>
        </div>
      ),
    },
  ]
}
