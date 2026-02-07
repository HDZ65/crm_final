/**
 * Engagement Domain gRPC Clients
 * Includes: Mailbox (EmailService), CalendarEvent, Meeting, CallSummary (AgendaService)
 */

import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, type GrpcClient } from "./config";

// ===== Email (Mailbox) imports =====
import {
  EmailServiceService,
  type Mailbox,
  type CreateMailboxRequest,
  type GetMailboxRequest,
  type GetMailboxesByOrganisationRequest,
  type GetMailboxesBySocieteRequest,
  type UpdateMailboxRequest,
  type DeleteMailboxRequest,
  type MailboxResponse,
  type MailboxListResponse,
  type DeleteResponse as EmailDeleteResponse,
} from "@proto/email/email";

// ===== Agenda (CalendarEvent, Meeting, CallSummary) imports =====
import {
  CalendarEventServiceService,
  MeetingServiceService,
  CallSummaryServiceService,
  type CalendarEvent,
  type CreateCalendarEventRequest,
  type GetCalendarEventRequest,
  type UpdateCalendarEventRequest,
  type DeleteCalendarEventRequest,
  type ListCalendarEventsByDateRangeRequest,
  type ListCalendarEventsByClientRequest,
  type ListCalendarEventsResponse,
  type SyncFromProviderRequest,
  type SyncFromProviderResponse,
  type DeleteResponse as AgendaDeleteResponse,
  type Meeting,
  type CreateMeetingRequest,
  type GetMeetingRequest,
  type ListMeetingsByDateRangeRequest,
  type ListMeetingsResponse,
  type MatchParticipantsRequest,
  type MatchParticipantsResponse,
  type UpdateClientMatchRequest,
  type CallSummary,
  type GetCallSummaryRequest,
  type GetCallSummaryByMeetingRequest,
  type RegenerateCallSummaryRequest,
} from "@proto/agenda/agenda";

// ===== Singleton instances =====
let mailboxInstance: GrpcClient | null = null;
let calendarEventInstance: GrpcClient | null = null;
let meetingInstance: GrpcClient | null = null;
let callSummaryInstance: GrpcClient | null = null;

// ===== Client factories =====

function getMailboxClient(): GrpcClient {
  if (!mailboxInstance) {
    mailboxInstance = makeClient(
      EmailServiceService,
      "EmailService",
      SERVICES.email,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return mailboxInstance;
}

function getCalendarEventClient(): GrpcClient {
  if (!calendarEventInstance) {
    calendarEventInstance = makeClient(
      CalendarEventServiceService,
      "CalendarEventService",
      SERVICES.agenda,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return calendarEventInstance;
}

function getMeetingClient(): GrpcClient {
  if (!meetingInstance) {
    meetingInstance = makeClient(
      MeetingServiceService,
      "MeetingService",
      SERVICES.agenda,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return meetingInstance;
}

function getCallSummaryClient(): GrpcClient {
  if (!callSummaryInstance) {
    callSummaryInstance = makeClient(
      CallSummaryServiceService,
      "CallSummaryService",
      SERVICES.agenda,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return callSummaryInstance;
}

// ===== Exported client objects =====

export const mailbox = {
  create: (request: CreateMailboxRequest): Promise<MailboxResponse> =>
    promisify<CreateMailboxRequest, MailboxResponse>(
      getMailboxClient(),
      "createMailbox"
    )(request),

  get: (request: GetMailboxRequest): Promise<MailboxResponse> =>
    promisify<GetMailboxRequest, MailboxResponse>(
      getMailboxClient(),
      "getMailbox"
    )(request),

  getByOrganisation: (request: GetMailboxesByOrganisationRequest): Promise<MailboxListResponse> =>
    promisify<GetMailboxesByOrganisationRequest, MailboxListResponse>(
      getMailboxClient(),
      "getMailboxesByOrganisation"
    )(request),

  getBySociete: (request: GetMailboxesBySocieteRequest): Promise<MailboxListResponse> =>
    promisify<GetMailboxesBySocieteRequest, MailboxListResponse>(
      getMailboxClient(),
      "getMailboxesBySociete"
    )(request),

  update: (request: UpdateMailboxRequest): Promise<MailboxResponse> =>
    promisify<UpdateMailboxRequest, MailboxResponse>(
      getMailboxClient(),
      "updateMailbox"
    )(request),

  delete: (request: DeleteMailboxRequest): Promise<EmailDeleteResponse> =>
    promisify<DeleteMailboxRequest, EmailDeleteResponse>(
      getMailboxClient(),
      "deleteMailbox"
    )(request),
};

export const calendarEvent = {
  create: (request: CreateCalendarEventRequest): Promise<CalendarEvent> =>
    promisify<CreateCalendarEventRequest, CalendarEvent>(
      getCalendarEventClient(),
      "create"
    )(request),

  get: (request: GetCalendarEventRequest): Promise<CalendarEvent> =>
    promisify<GetCalendarEventRequest, CalendarEvent>(
      getCalendarEventClient(),
      "get"
    )(request),

  update: (request: UpdateCalendarEventRequest): Promise<CalendarEvent> =>
    promisify<UpdateCalendarEventRequest, CalendarEvent>(
      getCalendarEventClient(),
      "update"
    )(request),

  delete: (request: DeleteCalendarEventRequest): Promise<AgendaDeleteResponse> =>
    promisify<DeleteCalendarEventRequest, AgendaDeleteResponse>(
      getCalendarEventClient(),
      "delete"
    )(request),

  listByDateRange: (request: ListCalendarEventsByDateRangeRequest): Promise<ListCalendarEventsResponse> =>
    promisify<ListCalendarEventsByDateRangeRequest, ListCalendarEventsResponse>(
      getCalendarEventClient(),
      "listByDateRange"
    )(request),

  listByClient: (request: ListCalendarEventsByClientRequest): Promise<ListCalendarEventsResponse> =>
    promisify<ListCalendarEventsByClientRequest, ListCalendarEventsResponse>(
      getCalendarEventClient(),
      "listByClient"
    )(request),

  syncFromProvider: (request: SyncFromProviderRequest): Promise<SyncFromProviderResponse> =>
    promisify<SyncFromProviderRequest, SyncFromProviderResponse>(
      getCalendarEventClient(),
      "syncFromProvider"
    )(request),
};

export const meeting = {
  create: (request: CreateMeetingRequest): Promise<Meeting> =>
    promisify<CreateMeetingRequest, Meeting>(
      getMeetingClient(),
      "create"
    )(request),

  get: (request: GetMeetingRequest): Promise<Meeting> =>
    promisify<GetMeetingRequest, Meeting>(
      getMeetingClient(),
      "get"
    )(request),

  listByDateRange: (request: ListMeetingsByDateRangeRequest): Promise<ListMeetingsResponse> =>
    promisify<ListMeetingsByDateRangeRequest, ListMeetingsResponse>(
      getMeetingClient(),
      "listByDateRange"
    )(request),

  matchParticipants: (request: MatchParticipantsRequest): Promise<MatchParticipantsResponse> =>
    promisify<MatchParticipantsRequest, MatchParticipantsResponse>(
      getMeetingClient(),
      "matchParticipants"
    )(request),

  updateClientMatch: (request: UpdateClientMatchRequest): Promise<Meeting> =>
    promisify<UpdateClientMatchRequest, Meeting>(
      getMeetingClient(),
      "updateClientMatch"
    )(request),
};

export const callSummary = {
  get: (request: GetCallSummaryRequest): Promise<CallSummary> =>
    promisify<GetCallSummaryRequest, CallSummary>(
      getCallSummaryClient(),
      "get"
    )(request),

  getByMeeting: (request: GetCallSummaryByMeetingRequest): Promise<CallSummary> =>
    promisify<GetCallSummaryByMeetingRequest, CallSummary>(
      getCallSummaryClient(),
      "getByMeeting"
    )(request),

  regenerate: (request: RegenerateCallSummaryRequest): Promise<CallSummary> =>
    promisify<RegenerateCallSummaryRequest, CallSummary>(
      getCallSummaryClient(),
      "regenerate"
    )(request),
};

// Re-export types for convenience
export type {
  // Mailbox
  Mailbox,
  CreateMailboxRequest,
  UpdateMailboxRequest,
  GetMailboxRequest,
  GetMailboxesByOrganisationRequest,
  GetMailboxesBySocieteRequest,
  MailboxResponse,
  MailboxListResponse,
  // CalendarEvent
  CalendarEvent,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
  GetCalendarEventRequest,
  ListCalendarEventsByDateRangeRequest,
  ListCalendarEventsByClientRequest,
  ListCalendarEventsResponse,
  SyncFromProviderRequest,
  SyncFromProviderResponse,
  // Meeting
  Meeting,
  CreateMeetingRequest,
  GetMeetingRequest,
  ListMeetingsByDateRangeRequest,
  ListMeetingsResponse,
  MatchParticipantsRequest,
  MatchParticipantsResponse,
  UpdateClientMatchRequest,
  // CallSummary
  CallSummary,
  GetCallSummaryRequest,
  GetCallSummaryByMeetingRequest,
  RegenerateCallSummaryRequest,
};
