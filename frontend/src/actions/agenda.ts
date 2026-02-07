"use server";

import { calendarEvent, meeting, callSummary } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import type {
  CalendarEvent,
  ListCalendarEventsResponse,
  SyncFromProviderResponse,
  Meeting,
  ListMeetingsResponse,
  MatchParticipantsResponse,
  CallSummary,
} from "@proto/agenda/agenda";
import type { ActionResult } from "@/lib/types/common";

// =============================================
// CalendarEvent Actions
// =============================================

export async function createCalendarEvent(input: {
  userId: string;
  organisationId: string;
  provider?: number;
  externalId?: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: string;
  isAllDay?: boolean;
  source?: number;
  sourceUrl?: string;
  meetingId?: string;
}): Promise<ActionResult<CalendarEvent>> {
  try {
    const data = await calendarEvent.create({
      user_id: input.userId,
      organisation_id: input.organisationId,
      provider: input.provider ?? 0,
      external_id: input.externalId ?? "",
      title: input.title,
      description: input.description ?? "",
      start_time: input.startTime,
      end_time: input.endTime,
      location: input.location ?? "",
      attendees: input.attendees ?? "",
      is_all_day: input.isAllDay ?? false,
      source: input.source ?? 0,
      source_url: input.sourceUrl ?? "",
      meeting_id: input.meetingId ?? "",
    });
    revalidatePath("/agenda");
    revalidatePath("/calendar");
    return { data, error: null };
  } catch (err) {
    console.error("[createCalendarEvent] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la cr\u00e9ation de l'\u00e9v\u00e9nement",
    };
  }
}

export async function getCalendarEvent(
  id: string
): Promise<ActionResult<CalendarEvent>> {
  try {
    const data = await calendarEvent.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getCalendarEvent] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement de l'\u00e9v\u00e9nement",
    };
  }
}

export async function updateCalendarEvent(input: {
  id: string;
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  attendees?: string;
  isAllDay?: boolean;
  sourceUrl?: string;
  meetingId?: string;
}): Promise<ActionResult<CalendarEvent>> {
  try {
    const data = await calendarEvent.update({
      id: input.id,
      title: input.title ?? "",
      description: input.description ?? "",
      start_time: input.startTime ?? "",
      end_time: input.endTime ?? "",
      location: input.location ?? "",
      attendees: input.attendees ?? "",
      is_all_day: input.isAllDay ?? false,
      source_url: input.sourceUrl ?? "",
      meeting_id: input.meetingId ?? "",
    });
    revalidatePath("/agenda");
    revalidatePath("/calendar");
    return { data, error: null };
  } catch (err) {
    console.error("[updateCalendarEvent] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise \u00e0 jour de l'\u00e9v\u00e9nement",
    };
  }
}

export async function deleteCalendarEvent(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const response = await calendarEvent.delete({ id });
    revalidatePath("/agenda");
    revalidatePath("/calendar");
    return { data: { success: response.success }, error: null };
  } catch (err) {
    console.error("[deleteCalendarEvent] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression de l'\u00e9v\u00e9nement",
    };
  }
}

export async function listCalendarEventsByDateRange(input: {
  userId: string;
  organisationId: string;
  startDate: string;
  endDate: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<ListCalendarEventsResponse>> {
  try {
    const data = await calendarEvent.listByDateRange({
      user_id: input.userId,
      organisation_id: input.organisationId,
      start_date: input.startDate,
      end_date: input.endDate,
      pagination: {
        page: input.page ?? 1,
        limit: input.limit ?? 50,
        sort_by: "start_time",
        sort_order: "asc",
      },
    });
    return { data, error: null };
  } catch (err) {
    console.error("[listCalendarEventsByDateRange] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des \u00e9v\u00e9nements",
    };
  }
}

export async function listCalendarEventsByClient(input: {
  clientId: string;
  organisationId: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<ListCalendarEventsResponse>> {
  try {
    const data = await calendarEvent.listByClient({
      client_id: input.clientId,
      organisation_id: input.organisationId,
      pagination: {
        page: input.page ?? 1,
        limit: input.limit ?? 20,
        sort_by: "start_time",
        sort_order: "desc",
      },
    });
    return { data, error: null };
  } catch (err) {
    console.error("[listCalendarEventsByClient] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des \u00e9v\u00e9nements du client",
    };
  }
}

export async function syncCalendarFromProvider(
  oauthConnectionId: string,
  syncFromDate?: string
): Promise<ActionResult<SyncFromProviderResponse>> {
  try {
    const data = await calendarEvent.syncFromProvider({
      oauth_connection_id: oauthConnectionId,
      sync_from_date: syncFromDate ?? "",
    });
    revalidatePath("/agenda");
    revalidatePath("/calendar");
    return { data, error: null };
  } catch (err) {
    console.error("[syncCalendarFromProvider] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la synchronisation du calendrier",
    };
  }
}

// =============================================
// Meeting Actions
// =============================================

export async function createMeeting(input: {
  userId: string;
  organisationId: string;
  provider?: number;
  externalMeetingId?: string;
  title: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  participants?: string;
  recordingUrl?: string;
  transcriptUrl?: string;
  calendarEventId?: string;
}): Promise<ActionResult<Meeting>> {
  try {
    const data = await meeting.create({
      user_id: input.userId,
      organisation_id: input.organisationId,
      provider: input.provider ?? 0,
      external_meeting_id: input.externalMeetingId ?? "",
      title: input.title,
      start_time: input.startTime,
      end_time: input.endTime,
      duration_minutes: input.durationMinutes ?? 0,
      participants: input.participants ?? "",
      recording_url: input.recordingUrl ?? "",
      transcript_url: input.transcriptUrl ?? "",
      calendar_event_id: input.calendarEventId ?? "",
    });
    revalidatePath("/agenda");
    revalidatePath("/meetings");
    return { data, error: null };
  } catch (err) {
    console.error("[createMeeting] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la cr\u00e9ation de la r\u00e9union",
    };
  }
}

export async function getMeeting(
  id: string
): Promise<ActionResult<Meeting>> {
  try {
    const data = await meeting.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getMeeting] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement de la r\u00e9union",
    };
  }
}

export async function listMeetingsByDateRange(input: {
  userId: string;
  organisationId: string;
  startDate: string;
  endDate: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<ListMeetingsResponse>> {
  try {
    const data = await meeting.listByDateRange({
      user_id: input.userId,
      organisation_id: input.organisationId,
      start_date: input.startDate,
      end_date: input.endDate,
      pagination: {
        page: input.page ?? 1,
        limit: input.limit ?? 20,
        sort_by: "start_time",
        sort_order: "desc",
      },
    });
    return { data, error: null };
  } catch (err) {
    console.error("[listMeetingsByDateRange] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des r\u00e9unions",
    };
  }
}

export async function matchMeetingParticipants(
  meetingId: string
): Promise<ActionResult<MatchParticipantsResponse>> {
  try {
    const data = await meeting.matchParticipants({
      meeting_id: meetingId,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[matchMeetingParticipants] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du matching des participants",
    };
  }
}

export async function updateMeetingClientMatch(input: {
  meetingId: string;
  participantEmail: string;
  clientId: string;
  matchType?: number;
}): Promise<ActionResult<Meeting>> {
  try {
    const data = await meeting.updateClientMatch({
      meeting_id: input.meetingId,
      participant_email: input.participantEmail,
      client_id: input.clientId,
      match_type: input.matchType ?? 0,
    });
    revalidatePath("/meetings");
    revalidatePath("/agenda");
    return { data, error: null };
  } catch (err) {
    console.error("[updateMeetingClientMatch] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise \u00e0 jour du matching client",
    };
  }
}

// =============================================
// CallSummary Actions
// =============================================

export async function getCallSummary(
  id: string
): Promise<ActionResult<CallSummary>> {
  try {
    const data = await callSummary.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getCallSummary] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement du r\u00e9sum\u00e9 d'appel",
    };
  }
}

export async function getCallSummaryByMeeting(
  meetingId: string
): Promise<ActionResult<CallSummary>> {
  try {
    const data = await callSummary.getByMeeting({
      meeting_id: meetingId,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getCallSummaryByMeeting] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement du r\u00e9sum\u00e9 de la r\u00e9union",
    };
  }
}

export async function regenerateCallSummary(
  meetingId: string,
  aiModel?: string
): Promise<ActionResult<CallSummary>> {
  try {
    const data = await callSummary.regenerate({
      meeting_id: meetingId,
      ai_model: aiModel ?? "",
    });
    revalidatePath("/meetings");
    revalidatePath("/agenda");
    return { data, error: null };
  } catch (err) {
    console.error("[regenerateCallSummary] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la reg\u00e9n\u00e9ration du r\u00e9sum\u00e9",
    };
  }
}
