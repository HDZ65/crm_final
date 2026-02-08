"use client"

import * as React from "react"
import {
  createCalendarEvent,
  createMeeting,
  deleteCalendarEvent,
  getCallSummaryByMeeting,
  listCalendarEventsByDateRange,
  listMeetingsByDateRange,
  matchMeetingParticipants,
  regenerateCallSummary,
  updateCalendarEvent,
} from "@/actions/agenda"
import { useOrganisation } from "@/contexts/organisation-context"
import { useAuth } from "@/hooks/auth"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  CalendarDays,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react"

type CalendarEvent = any
type Meeting = any
type CallSummary = any
type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

const EMPTY_EVENT_FORM = {
  title: "",
  description: "",
  startTime: "",
  endTime: "",
  location: "",
  attendees: "",
  isAllDay: false,
  sourceUrl: "",
  meetingId: "",
}

const EMPTY_MEETING_FORM = {
  title: "",
  startTime: "",
  endTime: "",
  durationMinutes: "",
  participants: "",
  recordingUrl: "",
  transcriptUrl: "",
  calendarEventId: "",
}

const SUMMARY_STATUS_LABELS: Record<number, string> = {
  0: "Non défini",
  1: "En attente",
  2: "En traitement",
  3: "Terminé",
  4: "Échec",
  5: "Sans transcription",
}

const SUMMARY_STATUS_VARIANTS: Record<number, BadgeVariant> = {
  0: "outline",
  1: "secondary",
  2: "secondary",
  3: "default",
  4: "destructive",
  5: "outline",
}

function toLocalDateTimeInput(value?: string) {
  if (!value) {
    return ""
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function toIsoDateTime(value: string) {
  if (!value) {
    return ""
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }
  return date.toISOString()
}

function formatDateTime(value?: string) {
  if (!value) {
    return "-"
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "-"
  }
  return date.toLocaleString("fr-FR")
}

function getSummaryStatus(status?: number) {
  const normalizedStatus = typeof status === "number" ? status : 0
  return {
    label: SUMMARY_STATUS_LABELS[normalizedStatus] ?? SUMMARY_STATUS_LABELS[0],
    variant: SUMMARY_STATUS_VARIANTS[normalizedStatus] ?? "outline",
  }
}

export function AgendaPageClient() {
  const { user } = useAuth()
  const { utilisateur, activeOrganisation } = useOrganisation()

  const userId = utilisateur?.id || user?.id || ""
  const organisationId = activeOrganisation?.organisationId || ""
  const hasContext = Boolean(userId && organisationId)

  const [activeTab, setActiveTab] = React.useState("events")
  const [calendarEvents, setCalendarEvents] = React.useState<CalendarEvent[]>([])
  const [meetings, setMeetings] = React.useState<Meeting[]>([])
  const [isLoadingData, setIsLoadingData] = React.useState(false)

  const [eventDialogOpen, setEventDialogOpen] = React.useState(false)
  const [eventDeleteDialogOpen, setEventDeleteDialogOpen] = React.useState(false)
  const [editingEvent, setEditingEvent] = React.useState<CalendarEvent | null>(null)
  const [deletingEvent, setDeletingEvent] = React.useState<CalendarEvent | null>(null)
  const [eventForm, setEventForm] = React.useState(EMPTY_EVENT_FORM)
  const [isSavingEvent, setIsSavingEvent] = React.useState(false)
  const [isDeletingEvent, setIsDeletingEvent] = React.useState(false)

  const [meetingDialogOpen, setMeetingDialogOpen] = React.useState(false)
  const [meetingForm, setMeetingForm] = React.useState(EMPTY_MEETING_FORM)
  const [isSavingMeeting, setIsSavingMeeting] = React.useState(false)
  const [matchingMeetingId, setMatchingMeetingId] = React.useState<string | null>(null)

  const [selectedMeetingId, setSelectedMeetingId] = React.useState("")
  const [callSummary, setCallSummary] = React.useState<CallSummary | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = React.useState(false)
  const [isRegeneratingSummary, setIsRegeneratingSummary] = React.useState(false)

  const selectedMeeting = React.useMemo(() => {
    return meetings.find((meeting) => meeting.id === selectedMeetingId) || null
  }, [meetings, selectedMeetingId])

  const buildDateRange = React.useCallback(() => {
    const now = new Date()
    const startDate = new Date(now)
    const endDate = new Date(now)
    startDate.setDate(now.getDate() - 30)
    endDate.setDate(now.getDate() + 90)
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }
  }, [])

  const fetchAgendaData = React.useCallback(async () => {
    if (!hasContext) {
      setCalendarEvents([])
      setMeetings([])
      setSelectedMeetingId("")
      setCallSummary(null)
      return
    }

    setIsLoadingData(true)

    const range = buildDateRange()
    const [eventsResult, meetingsResult] = await Promise.all([
      listCalendarEventsByDateRange({
        userId,
        organisationId,
        startDate: range.startDate,
        endDate: range.endDate,
        limit: 100,
      }),
      listMeetingsByDateRange({
        userId,
        organisationId,
        startDate: range.startDate,
        endDate: range.endDate,
        limit: 100,
      }),
    ])

    if (eventsResult.error) {
      toast.error(eventsResult.error)
    }
    if (meetingsResult.error) {
      toast.error(meetingsResult.error)
    }

    setCalendarEvents(eventsResult.data?.events ?? [])
    setMeetings(meetingsResult.data?.meetings ?? [])
    setIsLoadingData(false)
  }, [buildDateRange, hasContext, organisationId, userId])

  React.useEffect(() => {
    void fetchAgendaData()
  }, [fetchAgendaData])

  React.useEffect(() => {
    if (!selectedMeetingId) {
      return
    }
    const meetingStillExists = meetings.some((meeting) => meeting.id === selectedMeetingId)
    if (!meetingStillExists) {
      setSelectedMeetingId("")
      setCallSummary(null)
    }
  }, [meetings, selectedMeetingId])

  const handleOpenCreateEventDialog = () => {
    setEditingEvent(null)
    setEventForm(EMPTY_EVENT_FORM)
    setEventDialogOpen(true)
  }

  const handleOpenEditEventDialog = (eventItem: CalendarEvent) => {
    setEditingEvent(eventItem)
    setEventForm({
      title: eventItem.title || "",
      description: eventItem.description || "",
      startTime: toLocalDateTimeInput(eventItem.start_time || eventItem.startTime),
      endTime: toLocalDateTimeInput(eventItem.end_time || eventItem.endTime),
      location: eventItem.location || "",
      attendees: eventItem.attendees || "",
      isAllDay: Boolean(eventItem.is_all_day ?? eventItem.isAllDay),
      sourceUrl: eventItem.source_url || eventItem.sourceUrl || "",
      meetingId: eventItem.meeting_id || eventItem.meetingId || "",
    })
    setEventDialogOpen(true)
  }

  const handleSaveEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!hasContext) {
      toast.error("Utilisateur ou organisation manquant")
      return
    }

    if (!eventForm.title.trim() || !eventForm.startTime || !eventForm.endTime) {
      toast.error("Le titre, le début et la fin sont obligatoires")
      return
    }

    const startIso = toIsoDateTime(eventForm.startTime)
    const endIso = toIsoDateTime(eventForm.endTime)

    if (!startIso || !endIso) {
      toast.error("Format de date invalide")
      return
    }

    setIsSavingEvent(true)

    try {
      const payload = {
        title: eventForm.title.trim(),
        description: eventForm.description.trim() || undefined,
        startTime: startIso,
        endTime: endIso,
        location: eventForm.location.trim() || undefined,
        attendees: eventForm.attendees.trim() || undefined,
        isAllDay: eventForm.isAllDay,
        sourceUrl: eventForm.sourceUrl.trim() || undefined,
        meetingId: eventForm.meetingId.trim() || undefined,
      }

      const result = editingEvent?.id
        ? await updateCalendarEvent({ id: editingEvent.id, ...payload })
        : await createCalendarEvent({
            userId,
            organisationId,
            ...payload,
          })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(editingEvent ? "Événement mis à jour" : "Événement créé")
      setEventDialogOpen(false)
      setEditingEvent(null)
      setEventForm(EMPTY_EVENT_FORM)
      await fetchAgendaData()
    } finally {
      setIsSavingEvent(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!deletingEvent?.id) {
      return
    }

    setIsDeletingEvent(true)

    try {
      const result = await deleteCalendarEvent(deletingEvent.id)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Événement supprimé")
      setEventDeleteDialogOpen(false)
      setDeletingEvent(null)
      await fetchAgendaData()
    } finally {
      setIsDeletingEvent(false)
    }
  }

  const handleOpenCreateMeetingDialog = () => {
    setMeetingForm(EMPTY_MEETING_FORM)
    setMeetingDialogOpen(true)
  }

  const handleSaveMeeting = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!hasContext) {
      toast.error("Utilisateur ou organisation manquant")
      return
    }

    if (!meetingForm.title.trim() || !meetingForm.startTime || !meetingForm.endTime) {
      toast.error("Le titre, le début et la fin sont obligatoires")
      return
    }

    const startIso = toIsoDateTime(meetingForm.startTime)
    const endIso = toIsoDateTime(meetingForm.endTime)

    if (!startIso || !endIso) {
      toast.error("Format de date invalide")
      return
    }

    const durationMinutes = meetingForm.durationMinutes
      ? Number.parseInt(meetingForm.durationMinutes, 10)
      : undefined

    if (meetingForm.durationMinutes && Number.isNaN(durationMinutes)) {
      toast.error("La durée doit être un nombre")
      return
    }

    setIsSavingMeeting(true)

    try {
      const result = await createMeeting({
        userId,
        organisationId,
        title: meetingForm.title.trim(),
        startTime: startIso,
        endTime: endIso,
        durationMinutes,
        participants: meetingForm.participants.trim() || undefined,
        recordingUrl: meetingForm.recordingUrl.trim() || undefined,
        transcriptUrl: meetingForm.transcriptUrl.trim() || undefined,
        calendarEventId: meetingForm.calendarEventId.trim() || undefined,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Réunion créée")
      setMeetingDialogOpen(false)
      setMeetingForm(EMPTY_MEETING_FORM)
      await fetchAgendaData()
    } finally {
      setIsSavingMeeting(false)
    }
  }

  const handleMatchParticipants = async (meetingId: string) => {
    setMatchingMeetingId(meetingId)

    try {
      const result = await matchMeetingParticipants(meetingId)

      if (result.error) {
        toast.error(result.error)
        return
      }

      const matched = result.data?.matched_count ?? 0
      const unmatched = result.data?.unmatched_count ?? 0
      toast.success(`Matching terminé: ${matched} trouvé(s), ${unmatched} non trouvé(s)`)
    } finally {
      setMatchingMeetingId(null)
    }
  }

  const handleLoadSummary = async (meetingId: string) => {
    setSelectedMeetingId(meetingId)
    setIsLoadingSummary(true)

    try {
      const result = await getCallSummaryByMeeting(meetingId)

      if (result.error) {
        toast.error(result.error)
        setCallSummary(null)
        return
      }

      setCallSummary(result.data)
      if (!result.data) {
        toast.info("Aucun résumé disponible pour cette réunion")
      }
    } finally {
      setIsLoadingSummary(false)
    }
  }

  const handleRegenerateSummary = async () => {
    if (!selectedMeetingId) {
      toast.error("Sélectionnez une réunion pour régénérer le résumé")
      return
    }

    setIsRegeneratingSummary(true)

    try {
      const result = await regenerateCallSummary(selectedMeetingId)

      if (result.error) {
        toast.error(result.error)
        return
      }

      setCallSummary(result.data)
      toast.success("Résumé régénéré")
    } finally {
      setIsRegeneratingSummary(false)
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <CalendarDays className="size-6" />
            Agenda
          </h1>
          <p className="text-muted-foreground">
            Gérez les événements, les réunions et les résumés d&apos;appels depuis un seul espace.
          </p>
        </div>
        <Button variant="outline" onClick={() => void fetchAgendaData()} disabled={isLoadingData || !hasContext}>
          {isLoadingData ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
          Actualiser
        </Button>
      </div>

      {!hasContext && (
        <Card className="border-dashed">
          <CardContent className="py-6 text-sm text-muted-foreground">
            Le contexte utilisateur ou organisation n&apos;est pas encore prêt. Les actions agenda seront
            disponibles dès que la session sera chargée.
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events">Événements</TabsTrigger>
          <TabsTrigger value="meetings">Réunions</TabsTrigger>
          <TabsTrigger value="summaries">Résumés d&apos;appels</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Événements du calendrier</CardTitle>
                  <CardDescription>{calendarEvents.length} événement(s) dans la période affichée</CardDescription>
                </div>
                <Button onClick={handleOpenCreateEventDialog} disabled={!hasContext}>
                  <Plus className="mr-2 size-4" />
                  Nouvel événement
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Début</TableHead>
                    <TableHead>Fin</TableHead>
                    <TableHead>Lieu</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingData && calendarEvents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        <Loader2 className="mx-auto size-5 animate-spin" />
                      </TableCell>
                    </TableRow>
                  )}

                  {!isLoadingData && calendarEvents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Aucun événement trouvé
                      </TableCell>
                    </TableRow>
                  )}

                  {calendarEvents.map((eventItem) => (
                    <TableRow key={eventItem.id}>
                      <TableCell className="font-medium">{eventItem.title || "Sans titre"}</TableCell>
                      <TableCell>{formatDateTime(eventItem.start_time || eventItem.startTime)}</TableCell>
                      <TableCell>{formatDateTime(eventItem.end_time || eventItem.endTime)}</TableCell>
                      <TableCell>{eventItem.location || "-"}</TableCell>
                      <TableCell>{eventItem.attendees || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditEventDialog(eventItem)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeletingEvent(eventItem)
                              setEventDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meetings" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Réunions</CardTitle>
                  <CardDescription>{meetings.length} réunion(s) dans la période affichée</CardDescription>
                </div>
                <Button onClick={handleOpenCreateMeetingDialog} disabled={!hasContext}>
                  <Plus className="mr-2 size-4" />
                  Nouvelle réunion
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Début</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Statut résumé</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingData && meetings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        <Loader2 className="mx-auto size-5 animate-spin" />
                      </TableCell>
                    </TableRow>
                  )}

                  {!isLoadingData && meetings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Aucune réunion trouvée
                      </TableCell>
                    </TableRow>
                  )}

                  {meetings.map((meetingItem) => {
                    const summaryStatus = getSummaryStatus(meetingItem.summary_status)

                    return (
                      <TableRow key={meetingItem.id}>
                        <TableCell className="font-medium">{meetingItem.title || "Sans titre"}</TableCell>
                        <TableCell>{formatDateTime(meetingItem.start_time || meetingItem.startTime)}</TableCell>
                        <TableCell>
                          {meetingItem.duration_minutes
                            ? `${meetingItem.duration_minutes} min`
                            : meetingItem.durationMinutes
                              ? `${meetingItem.durationMinutes} min`
                              : "-"}
                        </TableCell>
                        <TableCell>{meetingItem.participants || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={summaryStatus.variant}>{summaryStatus.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void handleMatchParticipants(meetingItem.id)}
                              disabled={matchingMeetingId === meetingItem.id}
                            >
                              {matchingMeetingId === meetingItem.id ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                              ) : (
                                <Users className="mr-2 size-4" />
                              )}
                              Match participants
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setActiveTab("summaries")
                                void handleLoadSummary(meetingItem.id)
                              }}
                            >
                              <FileText className="mr-2 size-4" />
                              Résumé
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summaries" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Réunions disponibles</CardTitle>
                <CardDescription>Sélectionnez une réunion pour voir son résumé</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Réunion</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {meetings.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="h-16 text-center text-muted-foreground">
                          Aucune réunion disponible
                        </TableCell>
                      </TableRow>
                    )}
                    {meetings.map((meetingItem) => (
                      <TableRow key={meetingItem.id}>
                        <TableCell>
                          <div className="font-medium">{meetingItem.title || "Sans titre"}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDateTime(meetingItem.start_time || meetingItem.startTime)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={selectedMeetingId === meetingItem.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => void handleLoadSummary(meetingItem.id)}
                          >
                            Ouvrir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>Visionneuse de résumé</CardTitle>
                    <CardDescription>
                      {selectedMeeting
                        ? `Réunion sélectionnée: ${selectedMeeting.title || selectedMeeting.id}`
                        : "Sélectionnez une réunion pour charger le résumé"}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => void handleRegenerateSummary()}
                    disabled={!selectedMeetingId || isRegeneratingSummary}
                  >
                    {isRegeneratingSummary ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 size-4" />
                    )}
                    Régénérer
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingSummary ? (
                  <div className="flex h-48 items-center justify-center text-muted-foreground">
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    Chargement du résumé...
                  </div>
                ) : !selectedMeetingId ? (
                  <div className="h-48 content-center text-center text-muted-foreground">
                    Aucun résumé sélectionné
                  </div>
                ) : !callSummary ? (
                  <div className="h-48 content-center text-center text-muted-foreground">
                    Aucun résumé disponible pour cette réunion
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label>Meeting ID</Label>
                        <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                          {callSummary.meeting_id || selectedMeetingId}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label>Modèle IA</Label>
                        <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                          {callSummary.ai_model || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label>Résumé exécutif</Label>
                      <Textarea readOnly value={callSummary.executive_summary || ""} className="min-h-28" />
                    </div>

                    <div className="space-y-1">
                      <Label>Points clés</Label>
                      <Textarea readOnly value={callSummary.key_points || ""} className="min-h-28" />
                    </div>

                    <div className="space-y-1">
                      <Label>Décisions</Label>
                      <Textarea readOnly value={callSummary.decisions || ""} className="min-h-24" />
                    </div>

                    <div className="space-y-1">
                      <Label>Actions</Label>
                      <Textarea readOnly value={callSummary.action_items || ""} className="min-h-24" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Modifier" : "Créer"} un événement</DialogTitle>
            <DialogDescription>
              Renseignez les informations principales de l&apos;événement calendrier.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEvent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Titre *</Label>
              <Input
                id="event-title"
                value={eventForm.title}
                onChange={(inputEvent) =>
                  setEventForm((previous) => ({
                    ...previous,
                    title: inputEvent.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                value={eventForm.description}
                onChange={(inputEvent) =>
                  setEventForm((previous) => ({
                    ...previous,
                    description: inputEvent.target.value,
                  }))
                }
                className="min-h-20"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event-start">Début *</Label>
                <Input
                  id="event-start"
                  type="datetime-local"
                  value={eventForm.startTime}
                  onChange={(inputEvent) =>
                    setEventForm((previous) => ({
                      ...previous,
                      startTime: inputEvent.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-end">Fin *</Label>
                <Input
                  id="event-end"
                  type="datetime-local"
                  value={eventForm.endTime}
                  onChange={(inputEvent) =>
                    setEventForm((previous) => ({
                      ...previous,
                      endTime: inputEvent.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-location">Lieu</Label>
              <Input
                id="event-location"
                value={eventForm.location}
                onChange={(inputEvent) =>
                  setEventForm((previous) => ({
                    ...previous,
                    location: inputEvent.target.value,
                  }))
                }
                placeholder="Salle, URL visio, adresse..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-attendees">Participants (emails séparés par virgule)</Label>
              <Input
                id="event-attendees"
                value={eventForm.attendees}
                onChange={(inputEvent) =>
                  setEventForm((previous) => ({
                    ...previous,
                    attendees: inputEvent.target.value,
                  }))
                }
                placeholder="alice@crm.fr, bob@crm.fr"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event-source-url">URL source</Label>
                <Input
                  id="event-source-url"
                  value={eventForm.sourceUrl}
                  onChange={(inputEvent) =>
                    setEventForm((previous) => ({
                      ...previous,
                      sourceUrl: inputEvent.target.value,
                    }))
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-meeting-id">Meeting ID lié</Label>
                <Input
                  id="event-meeting-id"
                  value={eventForm.meetingId}
                  onChange={(inputEvent) =>
                    setEventForm((previous) => ({
                      ...previous,
                      meetingId: inputEvent.target.value,
                    }))
                  }
                  placeholder="meeting_..."
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="event-all-day"
                checked={eventForm.isAllDay}
                onCheckedChange={(checked) =>
                  setEventForm((previous) => ({
                    ...previous,
                    isAllDay: checked === true,
                  }))
                }
              />
              <Label htmlFor="event-all-day">Événement sur toute la journée</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEventDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSavingEvent}>
                {isSavingEvent && <Loader2 className="mr-2 size-4 animate-spin" />}
                {editingEvent ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={eventDeleteDialogOpen} onOpenChange={setEventDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet événement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L&apos;événement <strong>{deletingEvent?.title}</strong> sera
              supprimé définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} disabled={isDeletingEvent}>
              {isDeletingEvent && <Loader2 className="mr-2 size-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={meetingDialogOpen} onOpenChange={setMeetingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une réunion</DialogTitle>
            <DialogDescription>Ajoutez une réunion pour suivre les interactions client.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveMeeting} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meeting-title">Titre *</Label>
              <Input
                id="meeting-title"
                value={meetingForm.title}
                onChange={(inputEvent) =>
                  setMeetingForm((previous) => ({
                    ...previous,
                    title: inputEvent.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="meeting-start">Début *</Label>
                <Input
                  id="meeting-start"
                  type="datetime-local"
                  value={meetingForm.startTime}
                  onChange={(inputEvent) =>
                    setMeetingForm((previous) => ({
                      ...previous,
                      startTime: inputEvent.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting-end">Fin *</Label>
                <Input
                  id="meeting-end"
                  type="datetime-local"
                  value={meetingForm.endTime}
                  onChange={(inputEvent) =>
                    setMeetingForm((previous) => ({
                      ...previous,
                      endTime: inputEvent.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="meeting-duration">Durée (minutes)</Label>
                <Input
                  id="meeting-duration"
                  type="number"
                  min={0}
                  value={meetingForm.durationMinutes}
                  onChange={(inputEvent) =>
                    setMeetingForm((previous) => ({
                      ...previous,
                      durationMinutes: inputEvent.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting-calendar-event-id">Event calendrier lié</Label>
                <Input
                  id="meeting-calendar-event-id"
                  value={meetingForm.calendarEventId}
                  onChange={(inputEvent) =>
                    setMeetingForm((previous) => ({
                      ...previous,
                      calendarEventId: inputEvent.target.value,
                    }))
                  }
                  placeholder="event_..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting-participants">Participants</Label>
              <Input
                id="meeting-participants"
                value={meetingForm.participants}
                onChange={(inputEvent) =>
                  setMeetingForm((previous) => ({
                    ...previous,
                    participants: inputEvent.target.value,
                  }))
                }
                placeholder="alice@crm.fr, bob@crm.fr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting-recording-url">URL enregistrement</Label>
              <Input
                id="meeting-recording-url"
                value={meetingForm.recordingUrl}
                onChange={(inputEvent) =>
                  setMeetingForm((previous) => ({
                    ...previous,
                    recordingUrl: inputEvent.target.value,
                  }))
                }
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting-transcript-url">URL transcription</Label>
              <Input
                id="meeting-transcript-url"
                value={meetingForm.transcriptUrl}
                onChange={(inputEvent) =>
                  setMeetingForm((previous) => ({
                    ...previous,
                    transcriptUrl: inputEvent.target.value,
                  }))
                }
                placeholder="https://..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMeetingDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSavingMeeting}>
                {isSavingMeeting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}
