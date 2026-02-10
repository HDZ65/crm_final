# Module Agenda Complet — Sync Calendriers + Zoom/Meet + Résumés IA

## TL;DR

> **Quick Summary**: Créer un module Agenda complet dans le CRM : vue calendrier (semaine/mois/jour) synchronisée en lecture seule avec Google Calendar et Outlook, intégration Zoom + Google Meet via OAuth par utilisateur, récupération automatique des transcripts d'appels via webhooks, et génération de résumés IA (points clés, décisions, actions). Le tout dans `service-engagement` avec une nouvelle page `/agenda`.
>
> **Deliverables**:
> - Proto `agenda.proto` avec entités CalendarEvent, Meeting, OAuthConnection, CallSummary
> - Backend : OAuth flows Zoom/Google/Microsoft, webhook receivers, calendar sync engine, AI summarization pipeline via NATS
> - Frontend : Page `/agenda` avec vue calendrier (semaine/mois/jour), panel détail événement avec résumé IA, settings OAuth
> - Sidebar : Nouvel item "Agenda" avec icône CalendarDays
> - Documentation : Guide setup OAuth (Zoom Marketplace + Google Cloud Console + Microsoft Azure)
>
> **Estimated Effort**: XL
> **Parallel Execution**: YES — 4 waves (vertical slices)
> **Critical Path**: Task 1 (proto + entities) → Task 3 (OAuth flows) → Task 5 (calendar sync) → Task 7 (webhooks + AI)

---

## Context

### Original Request
L'utilisateur veut pouvoir résumer automatiquement les conversations d'appels Zoom et Google Meet dans le CRM. Au fil de l'interview, le scope a évolué vers un module Agenda complet car le calendrier existant (`/calendrier`) est un calendrier de prélèvements financiers, pas un agenda.

### Interview Summary
**Key Discussions**:
- **Plateformes** : Zoom + Google Meet (les deux dès le MVP)
- **Workflow** : Automatique — webhook détecte fin d'appel → récupère transcript → IA résume → rattache au client
- **Auth OAuth** : Chaque utilisateur connecte individuellement son compte (pas admin pour toute l'org)
- **Affichage** : Uniquement dans le module Agenda (PAS dans la timeline fiche client)
- **Calendrier** : Le `/calendrier` existant est financier → créer un vrai module Agenda from scratch
- **Scope Agenda** : Complet — sync Google Calendar/Outlook + création RDV + appels Zoom/Meet + résumés IA
- **Navigation** : Nouvelle entrée "Agenda" dans le sidebar → route `/agenda`
- **Backend** : `service-engagement` (déjà gère activités, notifications, tâches)
- **Stockage** : Seulement le résumé IA en DB. Transcript complet reste chez Zoom/Meet (URL/lien)
- **RGPD** : Pas géré dans le CRM pour le MVP (consentement géré côté Zoom/Meet)
- **Contenu résumé** : Résumé exécutif + Points clés + Décisions prises + Actions à suivre (PAS de sentiment)
- **Matching appel→client** : Automatique par email + correction manuelle possible

**Research Findings**:
- Service IA existant sur localhost:8000 avec SSE streaming (`GET /ai/generate?q=...&session_id=...`)
- WebSocket Socket.io dans service-engagement pour notifications temps réel
- Zoom API : webhooks `recording.completed` + `recording.transcript_completed`, transcripts VTT, signature HMAC-SHA256
- Google Meet API : Conference Records API + Workspace Events API → **nécessite Google Cloud Pub/Sub** (pas de HTTP webhooks directs)
- Google Meet transcripts nécessitent **Workspace Business Standard+** ($12/user/mois) — pas de support @gmail.com
- Pattern d'encryption OAuth existant dans `MailboxEntity` avec AES-256-GCM via `EncryptionService`
- Pattern PSP webhook inbox dans service-finance pour traitement idempotent
- NATS disponible pour messaging async dans tous les services

### Metis Review
**Identified Gaps** (addressed):
- **Sync bidirectionnelle** → Réduit à **read-only (externe → CRM)** pour le MVP. La sync bidirectionnelle double la complexité (conflits). Phase 2 si besoin.
- **Google Pub/Sub** → Google Meet n'utilise PAS de webhooks HTTP directs. Architecture Pub/Sub push subscription → endpoint HTTP dans service-engagement.
- **Google Workspace requirement** → Dégradation gracieuse : sync calendrier fonctionne pour tous, transcripts uniquement pour comptes Business Standard+.
- **Calendar library** → Shadcn custom calendar (cohérent avec le codebase) ou react-big-calendar pour les vues semaine/jour. PAS FullCalendar (trop lourd).
- **Webhook HTTP endpoints** → Premiers HTTP controllers dans service-engagement (port 3061). NestJS supporte HTTP + WebSocket sur le même port.
- **OAuth token architecture** → Nouvelle `OAuthConnectionEntity` (PAS réutiliser MailboxEntity) — providers différents, scopes différents.
- **AI pipeline** → Async via NATS : webhook handler → `agenda.transcript.received` → consumer appelle IA → `agenda.summary.completed` → notification WebSocket
- **Multi-user visibility** → Chaque utilisateur voit uniquement ses propres événements (pas de vue équipe pour le MVP)
- **Channel renewal Google Calendar** → Les push notification channels Google expirent. Cron de renouvellement nécessaire.
- **Sync token 410 Gone** → Google peut invalider les sync tokens. Full re-sync fallback obligatoire.

---

## Work Objectives

### Core Objective
Créer un module Agenda full-stack permettant aux utilisateurs de visualiser leurs rendez-vous (sync Google Calendar/Outlook en lecture seule), de voir les résumés IA automatiques de leurs appels Zoom/Google Meet, et de créer des événements CRM — le tout dans une nouvelle page `/agenda`.

### Concrete Deliverables
- `packages/proto/src/agenda/agenda.proto` — définitions proto complètes
- `services/service-engagement/src/domain/engagement/entities/` — 4 nouvelles entités TypeORM
- `services/service-engagement/src/infrastructure/grpc/agenda/` — controllers gRPC
- `services/service-engagement/src/infrastructure/http/webhooks/` — controllers HTTP webhooks Zoom + Google Pub/Sub
- `services/service-engagement/src/infrastructure/messaging/nats/handlers/` — consumers NATS pour AI pipeline
- `frontend/src/app/(main)/agenda/` — page Agenda avec vues calendrier
- `frontend/src/components/agenda/` — composants UI agenda
- `frontend/src/lib/grpc/clients/agenda.ts` — client gRPC
- `frontend/src/actions/agenda.ts` — server actions
- `docs/OAUTH_SETUP_AGENDA.md` — guide de setup OAuth

### Definition of Done
- [ ] Page `/agenda` accessible et affiche un calendrier navigable (mois/semaine/jour)
- [ ] Utilisateur peut connecter Google Calendar, Outlook, Zoom via OAuth
- [ ] Événements Google Calendar/Outlook apparaissent dans l'agenda CRM (sync read-only)
- [ ] Après un appel Zoom/Meet enregistré, le résumé IA apparaît automatiquement sur l'événement
- [ ] Résumé contient : résumé exécutif, points clés, décisions, actions à suivre
- [ ] Participants sont auto-matchés avec les clients CRM par email

### Must Have
- Vue calendrier mois/semaine/jour responsive
- OAuth per-user pour Zoom, Google, Microsoft
- Sync read-only Google Calendar → CRM
- Sync read-only Outlook Calendar → CRM (Microsoft Graph)
- Webhook receiver Zoom (`recording.completed`, `recording.transcript_completed`)
- Google Pub/Sub push subscription receiver pour Meet events
- Pipeline IA async via NATS pour résumer les transcripts
- Auto-matching participants → clients CRM par email + correction manuelle
- Notification WebSocket quand résumé IA prêt
- Dégradation gracieuse si Google Workspace < Business Standard (pas de transcripts, calendrier OK)

### Must NOT Have (Guardrails)
- ❌ Sync bidirectionnelle (CRM → externe). Read-only uniquement pour le MVP.
- ❌ Drag-and-drop d'événements sur le calendrier
- ❌ Édition inline des événements sur la grille calendrier
- ❌ Gestion des événements récurrents (edit recurrence rules). On affiche les instances individuelles.
- ❌ Résumés dans la timeline de la fiche client (UNIQUEMENT dans l'agenda)
- ❌ Envoi de notifications email depuis le module agenda
- ❌ UI de configuration custom du prompt IA
- ❌ Analyse de sentiment / tonalité
- ❌ Support des comptes personnels @gmail.com pour les transcripts Meet
- ❌ Bot qui rejoint les meetings (on utilise les recordings natifs Zoom/Meet)
- ❌ Stockage du transcript complet en DB (seulement URL + résumé)
- ❌ Vue équipe / multi-utilisateur (chaque user voit ses propres events)
- ❌ CalDAV / iCal import-export
- ❌ Mini-widget calendrier sur d'autres pages
- ❌ Settings avancés (timezone, préférences, notifications email)

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.
> ALL verification is executed by the agent using tools (Playwright, interactive_bash, curl, etc.).

### Test Decision
- **Infrastructure exists**: YES (bun test available in service-engagement)
- **Automated tests**: Tests-after (tests unitaires pour les services critiques)
- **Framework**: bun test (backend), Playwright (frontend E2E)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **Proto compilation** | Bash (buf generate) | `buf generate` → exit 0, generated .ts files exist |
| **Backend gRPC** | Bash (grpcurl) | Send requests, assert response fields |
| **Backend HTTP** | Bash (curl) | POST webhook payloads, assert status codes |
| **Frontend UI** | Playwright | Navigate, interact, assert DOM, screenshot |
| **OAuth flows** | Playwright + curl | Verify redirect URLs, callback handling |
| **NATS pipeline** | Bash (logs) | Publish event, verify consumer processes it |

---

## Execution Strategy

### Parallel Execution Waves (Vertical Slices)

```
Wave 1 (Start Immediately):
├── Task 1: Proto definitions + TypeORM entities + migrations + empty gRPC services
└── Task 2: Frontend calendar UI with mock data (no backend)

Wave 2 (After Wave 1):
├── Task 3: OAuth flows (Zoom + Google + Microsoft) [depends: Task 1]
├── Task 4: Frontend OAuth settings + sidebar [depends: Task 2]
└── Task 8: Documentation OAUTH_SETUP_AGENDA.md [no deps]

Wave 3 (After Wave 2):
├── Task 5: Calendar sync engine (Google Calendar + Outlook read-only) [depends: Task 3]
└── Task 6: Frontend calendar ↔ backend integration [depends: Task 3, Task 4]

Wave 4 (After Wave 3):
├── Task 7: Webhook receivers + AI summarization pipeline [depends: Task 5]
└── Task 9: Frontend meeting detail + AI summary display [depends: Task 6, Task 7]

Wave 5 (Final):
└── Task 10: Client matching + notifications + polish [depends: Task 9]
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3, 5, 6, 7 | 2, 8 |
| 2 | None | 4, 6, 9 | 1, 8 |
| 3 | 1 | 5, 6 | 4, 8 |
| 4 | 2 | 6 | 3, 8 |
| 5 | 3 | 7 | 6 |
| 6 | 3, 4 | 9 | 5 |
| 7 | 5 | 9 | — |
| 8 | None | — | 1, 2, 3, 4 |
| 9 | 6, 7 | 10 | — |
| 10 | 9 | — | — |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2 | Task 1: `category="unspecified-high"`, Task 2: `category="visual-engineering"` |
| 2 | 3, 4, 8 | Task 3: `category="deep"`, Task 4: `category="visual-engineering"`, Task 8: `category="writing"` |
| 3 | 5, 6 | Task 5: `category="ultrabrain"`, Task 6: `category="visual-engineering"` |
| 4 | 7, 9 | Task 7: `category="ultrabrain"`, Task 9: `category="visual-engineering"` |
| 5 | 10 | `category="unspecified-high"` |

---

## TODOs

- [ ] 1. Data Foundation — Proto + Entities + Migrations + Empty gRPC Services

  **What to do**:
  - Create `packages/proto/src/agenda/agenda.proto` with:
    - `OAuthConnectionService` : `ConnectProvider`, `DisconnectProvider`, `GetAuthUrl`, `HandleCallback`, `ListConnections`, `RefreshToken`
    - `CalendarEventService` : `Create`, `Update`, `Get`, `Delete`, `ListByDateRange`, `ListByClient`, `SyncFromProvider`
    - `MeetingService` : `Create`, `Get`, `ListByDateRange`, `MatchParticipants`, `UpdateClientMatch`
    - `CallSummaryService` : `Get`, `GetByMeeting`, `Regenerate`
    - Messages : `OAuthConnection` (id, user_id, organisation_id, provider enum [ZOOM, GOOGLE, MICROSOFT], status, scopes, connected_at), `CalendarEvent` (id, user_id, organisation_id, provider, external_id, title, description, start_time, end_time, location, attendees, is_all_day, source_url, meeting_id), `Meeting` (id, user_id, organisation_id, provider, external_meeting_id, title, start_time, end_time, duration_minutes, participants, recording_url, transcript_url, summary_status enum [PENDING, PROCESSING, COMPLETED, FAILED, NO_TRANSCRIPT]), `CallSummary` (id, meeting_id, executive_summary, key_points repeated, decisions repeated, action_items repeated, generated_at, ai_model), `MeetingParticipant` (email, display_name, client_base_id optional, match_type enum [EMAIL_EXACT, MANUAL, UNMATCHED], is_manual_override)
    - Enums : `OAuthProvider` (UNSPECIFIED=0, ZOOM=1, GOOGLE=2, MICROSOFT=3), `MeetingSummaryStatus` (UNSPECIFIED=0, PENDING=1, PROCESSING=2, COMPLETED=3, FAILED=4, NO_TRANSCRIPT=5), `ParticipantMatchType` (UNSPECIFIED=0, EMAIL_EXACT=1, MANUAL=2, UNMATCHED=3), `CalendarEventSource` (UNSPECIFIED=0, CRM=1, GOOGLE_CALENDAR=2, OUTLOOK=3, ZOOM=4, GOOGLE_MEET=5)
    - Standard patterns : `Pagination`/`PaginationResult`, `DeleteResponse`, `UNSPECIFIED=0` for all enums
  - Run `buf generate` to compile proto → TypeScript
  - Create 4 TypeORM entities in `services/service-engagement/src/domain/engagement/entities/`:
    - `oauth-connection.entity.ts` — encrypted access_token, refresh_token, token_expiry via EncryptionService. Columns: id (UUID PK), user_id, organisation_id, provider (enum), scopes (text), access_token_encrypted, refresh_token_encrypted, token_expires_at, status, connected_at, sync_token (for Google Calendar incremental sync), channel_id (for Google push notifications), channel_expiration
    - `calendar-event.entity.ts` — id, user_id, organisation_id, provider, external_id (unique per provider), title, description, start_time (timestamp with tz), end_time, location, attendees (jsonb), is_all_day, source_url, meeting_id (FK nullable), created_at, updated_at. Unique constraint on (user_id, provider, external_id).
    - `meeting.entity.ts` — id, user_id, organisation_id, provider, external_meeting_id, title, start_time, end_time, duration_minutes, participants (jsonb array of MeetingParticipant), recording_url, transcript_url, summary_status (enum), calendar_event_id (FK nullable), created_at, updated_at
    - `call-summary.entity.ts` — id, meeting_id (FK unique), executive_summary (text), key_points (jsonb string[]), decisions (jsonb string[]), action_items (jsonb string[]), generated_at, ai_model (string), raw_ai_response (text nullable for debugging)
  - Create TypeORM migration for all 4 tables
  - Register entities in `engagement.module.ts` → `TypeOrmModule.forFeature([...existing, OAuthConnectionEntity, CalendarEventEntity, MeetingEntity, CallSummaryEntity])`
  - Register entities in `app.module.ts` entities array
  - Create empty gRPC controller stubs in `services/service-engagement/src/infrastructure/grpc/agenda/`:
    - `oauth-connection.controller.ts`
    - `calendar-event.controller.ts`
    - `meeting.controller.ts`
    - `call-summary.controller.ts`
  - Create empty service stubs in `services/service-engagement/src/infrastructure/persistence/typeorm/repositories/engagement/`:
    - `oauth-connection.service.ts`
    - `calendar-event.service.ts`
    - `meeting.service.ts`
    - `call-summary.service.ts`
  - Add `'agenda'` to `getMultiGrpcOptions(['activites', 'notifications', 'email', 'agenda'])` in `main.ts`
  - Register `agenda` proto in shared-kernel's proto-loader service config
  - Add env vars template: `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_WEBHOOK_SECRET_TOKEN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_PUBSUB_TOPIC`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`

  **Must NOT do**:
  - Don't implement business logic yet — just entity definitions, empty CRUD stubs
  - Don't create HTTP controllers yet (webhook receivers are Task 7)
  - Don't add any logic to the gRPC controllers beyond returning empty/default responses

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Backend data modeling + proto definitions + migrations — core infrastructure work
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Domain expertise for adding entities/modules to existing NestJS DDD services
  - **Skills Evaluated but Omitted**:
    - `microservice-generator`: Not creating a new service, extending existing one

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 3, 5, 6, 7
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `packages/proto/src/activites/activites.proto` — Proto structure pattern: services, messages, CRUD methods, Pagination/PaginationResult, DeleteResponse, UNSPECIFIED=0 enums
  - `services/service-engagement/src/domain/engagement/entities/mailbox.entity.ts` — Entity with encrypted columns pattern (EncryptionService, AES-256-GCM)
  - `services/service-engagement/src/domain/engagement/entities/notification.entity.ts` — Standard entity pattern (UUID PK, @CreateDateColumn, snake_case columns)
  - `services/service-engagement/src/infrastructure/persistence/typeorm/repositories/engagement/notification.service.ts` — TypeORM repository service pattern
  - `services/service-engagement/src/infrastructure/grpc/notification.controller.ts` — gRPC controller pattern (@GrpcMethod decorator)
  - `services/service-engagement/src/engagement.module.ts` — Module wiring pattern (entities, controllers, services, exports)
  - `services/service-engagement/src/app.module.ts` — Root module with entities array
  - `services/service-engagement/src/main.ts:11` — `getMultiGrpcOptions(['activites', 'notifications', 'email'])` — where to add `'agenda'`

  **API/Type References**:
  - `packages/proto/src/activites/activites.proto:45-52` — Pagination and PaginationResult message definitions
  - `services/service-engagement/src/infrastructure/common/encryption.service.ts` — EncryptionService for token encryption

  **Acceptance Criteria**:

  - [ ] `buf generate` completes without errors
  - [ ] Proto TypeScript types generated in `frontend/src/proto/agenda/`
  - [ ] All 4 entities registered in engagement.module.ts and app.module.ts
  - [ ] Migration runs successfully: `bun run typeorm migration:run` → no errors
  - [ ] service-engagement starts without errors: `bun run start:dev` logs "SERVICE-ENGAGEMENT STARTED"
  - [ ] gRPC responds to stub calls (empty responses OK):
    ```
    grpcurl -plaintext localhost:50051 list
    # Assert: agenda.OAuthConnectionService, agenda.CalendarEventService, agenda.MeetingService, agenda.CallSummaryService visible
    ```

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Proto compilation succeeds
    Tool: Bash
    Preconditions: packages/proto/src/agenda/agenda.proto exists
    Steps:
      1. Run: buf generate (in packages/proto/)
      2. Assert: exit code 0
      3. Assert: frontend/src/proto/agenda/agenda.ts exists
      4. Assert: file contains "OAuthConnection" interface
    Expected Result: Proto compiles and TypeScript types generated
    Evidence: Command output captured

  Scenario: Service starts with new entities
    Tool: Bash
    Preconditions: Migration applied, entities registered
    Steps:
      1. Run: bun run start:dev (in services/service-engagement/)
      2. Wait for: "SERVICE-ENGAGEMENT STARTED" in stdout (timeout: 30s)
      3. Assert: "gRPC [activites, notifications, email, agenda]" in output
      4. Run: grpcurl -plaintext localhost:50051 list
      5. Assert: output contains "agenda.OAuthConnectionService"
    Expected Result: Service boots with agenda gRPC services registered
    Evidence: Terminal output captured

  Scenario: Database tables created
    Tool: Bash
    Preconditions: PostgreSQL running, migration applied
    Steps:
      1. Run: psql -h localhost -d engagement_db -c "\dt"
      2. Assert: tables oauth_connections, calendar_events, meetings, call_summaries exist
    Expected Result: All 4 new tables present in database
    Evidence: psql output captured
  ```

  **Commit**: YES
  - Message: `feat(agenda): add proto definitions, entities, migrations, and gRPC stubs for agenda module`
  - Files: `packages/proto/src/agenda/`, `services/service-engagement/src/domain/engagement/entities/oauth-connection.entity.ts`, `calendar-event.entity.ts`, `meeting.entity.ts`, `call-summary.entity.ts`, `services/service-engagement/src/infrastructure/grpc/agenda/`, `services/service-engagement/src/infrastructure/persistence/typeorm/repositories/engagement/`, migration file, `engagement.module.ts`, `app.module.ts`, `main.ts`

---

- [ ] 2. Frontend Calendar UI with Mock Data

  **What to do**:
  - Install `react-big-calendar` (or build custom Shadcn calendar — explore agent should decide based on codebase style)
  - Create `frontend/src/app/(main)/agenda/page.tsx` (Server Component) — loads mock data, passes to client
  - Create `frontend/src/app/(main)/agenda/agenda-page-client.tsx` ("use client") — main client component
  - Create components in `frontend/src/components/agenda/`:
    - `calendar-view.tsx` — Month/Week/Day views with navigation (prev/next/today), view mode switcher
    - `event-card.tsx` — Compact event display on calendar grid (title, time, provider badge)
    - `event-detail-panel.tsx` — Side panel or modal showing event details: title, time, location, attendees, provider badge, AI summary section (placeholder for now)
    - `empty-state.tsx` — "Connectez vos calendriers pour voir vos événements" with CTA
    - `index.ts` — Barrel exports
  - Mock data: Generate realistic French calendar events (meetings with clients, internal sync, calls) for current month
  - Views must be responsive: month view on desktop, week/day on mobile
  - Color-code events by source: CRM (primary), Google Calendar (blue), Outlook (violet), Zoom (cyan), Google Meet (green)
  - Use Shadcn Card, Badge, Button, Dialog/Sheet components
  - Support dark mode
  - **Do NOT add to sidebar yet** (Task 4 handles sidebar + OAuth settings)

  **Must NOT do**:
  - Don't install FullCalendar (too heavy, not consistent with codebase)
  - Don't connect to backend — pure mock data
  - Don't implement drag-and-drop or inline editing
  - Don't build recurring event editing UI

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Calendar UI is a complex visual component requiring responsive design, dark mode, animations
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Crafting beautiful calendar UI with Shadcn components
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not needed yet — mock data, no E2E testing

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Tasks 4, 6, 9
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/calendrier/page.tsx` — Server component pattern: fetch data → pass to client component
  - `frontend/src/app/(main)/calendrier/calendrier-page-client.tsx` — Client component with tabs pattern
  - `frontend/src/components/calendar/calendar-grid.tsx` — Custom calendar grid pattern (month navigation, day cells, detail modal)
  - `frontend/src/components/dashboard/greeting-briefing.tsx` — Component with loading skeleton + streaming content pattern
  - `frontend/src/components/app-sidebar.tsx:42-93` — NAV_ITEMS structure for sidebar reference

  **API/Type References**:
  - `frontend/src/components/ui/card.tsx` — Shadcn Card component
  - `frontend/src/components/ui/badge.tsx` — Shadcn Badge for provider indicators
  - `frontend/src/components/ui/dialog.tsx` / `frontend/src/components/ui/sheet.tsx` — For event detail panel
  - `frontend/src/components/ui/tabs.tsx` — For view mode switching
  - `frontend/src/components/ui/calendar.tsx` — Shadcn calendar (mini date picker, reference for styling)

  **Acceptance Criteria**:

  - [ ] Page `/agenda` renders without errors
  - [ ] Month view shows a full month grid with mock events
  - [ ] Week view shows 7-day timeline with hourly slots
  - [ ] Day view shows single day timeline with hourly slots
  - [ ] Navigation (prev/next/today) works in all views
  - [ ] View mode switcher (Month/Week/Day) transitions smoothly
  - [ ] Events are color-coded by source provider
  - [ ] Clicking an event opens detail panel with title, time, location, attendees
  - [ ] Empty state shows when no events
  - [ ] Responsive: month on desktop, default to week/day on mobile
  - [ ] Dark mode supported
  - [ ] `bun run type-check` passes

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Calendar renders with mock events in month view
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3000
    Steps:
      1. Navigate to: http://localhost:3000/agenda
      2. Wait for: [data-testid="calendar-view"] visible (timeout: 10s)
      3. Assert: Month view displayed (grid of day cells visible)
      4. Assert: At least 3 mock events visible on the grid
      5. Assert: Events have colored badges (provider indicators)
      6. Screenshot: .sisyphus/evidence/task-2-month-view.png
    Expected Result: Calendar month view renders with colored mock events
    Evidence: .sisyphus/evidence/task-2-month-view.png

  Scenario: View mode switching works
    Tool: Playwright (playwright skill)
    Preconditions: On /agenda page
    Steps:
      1. Click: button containing "Semaine" (week view)
      2. Wait for: view transition (timeout: 3s)
      3. Assert: 7-day columns visible with hourly slots
      4. Screenshot: .sisyphus/evidence/task-2-week-view.png
      5. Click: button containing "Jour" (day view)
      6. Wait for: view transition (timeout: 3s)
      7. Assert: Single day timeline visible
      8. Screenshot: .sisyphus/evidence/task-2-day-view.png
    Expected Result: View switches between month/week/day
    Evidence: .sisyphus/evidence/task-2-week-view.png, .sisyphus/evidence/task-2-day-view.png

  Scenario: Event detail panel opens on click
    Tool: Playwright (playwright skill)
    Preconditions: On /agenda page with mock events
    Steps:
      1. Click: first visible event on calendar grid
      2. Wait for: [data-testid="event-detail-panel"] visible (timeout: 5s)
      3. Assert: Panel shows event title
      4. Assert: Panel shows event time
      5. Assert: Panel shows provider badge
      6. Assert: Panel shows "Résumé IA" section (placeholder)
      7. Screenshot: .sisyphus/evidence/task-2-event-detail.png
    Expected Result: Detail panel displays all event information
    Evidence: .sisyphus/evidence/task-2-event-detail.png

  Scenario: Dark mode renders correctly
    Tool: Playwright (playwright skill)
    Preconditions: On /agenda page
    Steps:
      1. Execute JS: document.documentElement.classList.add('dark')
      2. Wait for: 1 second (CSS transition)
      3. Assert: Calendar background is dark
      4. Assert: Event cards are visible with contrast
      5. Screenshot: .sisyphus/evidence/task-2-dark-mode.png
    Expected Result: Calendar fully functional in dark mode
    Evidence: .sisyphus/evidence/task-2-dark-mode.png
  ```

  **Commit**: YES
  - Message: `feat(agenda): create calendar UI with month/week/day views and mock data`
  - Files: `frontend/src/app/(main)/agenda/`, `frontend/src/components/agenda/`

---

- [ ] 3. Backend OAuth Flows (Zoom + Google + Microsoft)

  **What to do**:
  - Implement `OAuthConnectionService` in `services/service-engagement/src/infrastructure/persistence/typeorm/repositories/engagement/oauth-connection.service.ts`:
    - `getAuthUrl(provider, redirectUri, scopes)` → Generate provider-specific OAuth authorize URL with state parameter (CSRF protection)
    - `handleCallback(provider, code, state)` → Exchange auth code for tokens, encrypt with EncryptionService, store in OAuthConnectionEntity
    - `refreshToken(connectionId)` → Refresh expired access token using refresh_token, update entity
    - `listConnections(userId, organisationId)` → List user's connected providers
    - `disconnectProvider(connectionId)` → Revoke tokens at provider + delete entity
  - Implement OAuth specifics per provider:
    - **Zoom**: `https://zoom.us/oauth/authorize` → `https://zoom.us/oauth/token`. Scopes: `recording:read`, `user:read:email`, `meeting:read`. HMAC-SHA256 for webhook verification.
    - **Google**: `https://accounts.google.com/o/oauth2/v2/auth` → `https://oauth2.googleapis.com/token`. Scopes: `calendar.readonly`, `meetings.space.readonly`, `drive.readonly` (for transcript files). Include `access_type=offline` for refresh token.
    - **Microsoft**: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize` → `.../token`. Scopes: `Calendars.Read`, `OnlineMeetings.Read`, `offline_access`.
  - Implement gRPC controller `oauth-connection.controller.ts` calling the service
  - Create Next.js API callback routes:
    - `frontend/src/app/api/auth/zoom/callback/page.tsx` — Receives OAuth code, exchanges via gRPC, closes popup
    - `frontend/src/app/api/auth/google-calendar/callback/page.tsx` — Same pattern for Google
    - `frontend/src/app/api/auth/microsoft-calendar/callback/page.tsx` — Same pattern for Microsoft
  - Follow existing OAuth callback pattern in `frontend/src/app/api/auth/google/callback/` (for email)
  - Create `frontend/src/lib/grpc/clients/agenda.ts` — gRPC client singleton for all agenda services
  - Create `frontend/src/actions/agenda.ts` — Server actions wrapping gRPC calls

  **Must NOT do**:
  - Don't implement calendar sync logic yet (Task 5)
  - Don't implement webhook receivers yet (Task 7)
  - Don't build the UI for connecting accounts (Task 4)
  - Don't implement token refresh cron yet (Task 5)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: OAuth flows are security-sensitive, require understanding of 3 different provider APIs, and need careful state/CSRF handling
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Adding features to existing NestJS DDD service

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 8)
  - **Blocks**: Tasks 5, 6
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `services/service-engagement/src/domain/engagement/entities/mailbox.entity.ts` — Entity with encrypted credentials (access_token, refresh_token)
  - `services/service-engagement/src/infrastructure/common/encryption.service.ts` — AES-256-GCM encryption for tokens
  - `frontend/src/hooks/ai/use-oauth-email.ts` — OAuth popup flow pattern (open popup, listen for callback)
  - `frontend/src/app/api/auth/google/callback/page.tsx` — OAuth callback page pattern (receive code, exchange, close popup)
  - `frontend/src/lib/grpc/clients/activites.ts` — gRPC client singleton pattern
  - `frontend/src/actions/calendar-admin.ts` — Server actions with `{data, error}` return pattern

  **External References**:
  - Zoom OAuth: `https://developers.zoom.us/docs/integrations/oauth/`
  - Google OAuth: `https://developers.google.com/identity/protocols/oauth2/web-server`
  - Microsoft OAuth: `https://learn.microsoft.com/en-us/graph/auth-v2-user`

  **Acceptance Criteria**:

  - [ ] `GetAuthUrl` returns valid OAuth URLs for all 3 providers
  - [ ] `HandleCallback` exchanges code, encrypts tokens, stores in DB
  - [ ] `RefreshToken` refreshes expired tokens for all providers
  - [ ] `ListConnections` returns user's connected providers
  - [ ] `DisconnectProvider` revokes and deletes connection
  - [ ] Frontend callback pages exchange code and close popup
  - [ ] gRPC client and server actions work end-to-end

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: GetAuthUrl returns valid Zoom OAuth URL
    Tool: Bash (grpcurl)
    Preconditions: service-engagement running
    Steps:
      1. grpcurl -plaintext -d '{"provider":"ZOOM","redirect_uri":"http://localhost:3000/api/auth/zoom/callback","scopes":["recording:read","user:read:email"]}' localhost:50051 agenda.OAuthConnectionService/GetAuthUrl
      2. Assert: response contains "authorization_url" field
      3. Assert: authorization_url starts with "https://zoom.us/oauth/authorize"
      4. Assert: authorization_url contains "client_id=" and "state="
    Expected Result: Valid Zoom OAuth URL returned with CSRF state
    Evidence: grpcurl response captured

  Scenario: GetAuthUrl returns valid Google OAuth URL
    Tool: Bash (grpcurl)
    Preconditions: service-engagement running
    Steps:
      1. grpcurl -plaintext -d '{"provider":"GOOGLE","redirect_uri":"http://localhost:3000/api/auth/google-calendar/callback","scopes":["calendar.readonly"]}' localhost:50051 agenda.OAuthConnectionService/GetAuthUrl
      2. Assert: response contains "authorization_url"
      3. Assert: URL starts with "https://accounts.google.com/o/oauth2"
      4. Assert: URL contains "access_type=offline"
    Expected Result: Valid Google OAuth URL with offline access
    Evidence: grpcurl response captured

  Scenario: ListConnections returns empty for new user
    Tool: Bash (grpcurl)
    Preconditions: service-engagement running, no connections in DB
    Steps:
      1. grpcurl -plaintext -d '{"user_id":"test-user","organisation_id":"test-org"}' localhost:50051 agenda.OAuthConnectionService/ListConnections
      2. Assert: response has "connections" as empty array
    Expected Result: Empty connections list
    Evidence: grpcurl response captured

  Scenario: Invalid provider returns error
    Tool: Bash (grpcurl)
    Preconditions: service-engagement running
    Steps:
      1. grpcurl -plaintext -d '{"provider":"INVALID","redirect_uri":"http://localhost:3000/callback"}' localhost:50051 agenda.OAuthConnectionService/GetAuthUrl
      2. Assert: gRPC error returned (INVALID_ARGUMENT or similar)
    Expected Result: Proper error handling for invalid provider
    Evidence: Error output captured
  ```

  **Commit**: YES
  - Message: `feat(agenda): implement OAuth flows for Zoom, Google, and Microsoft providers`
  - Files: OAuth service, gRPC controller, callback pages, gRPC client, server actions

---

- [ ] 4. Frontend OAuth Settings + Sidebar

  **What to do**:
  - Add "Agenda" item to `NAV_ITEMS` in `frontend/src/components/app-sidebar.tsx`:
    - Title: "Agenda", url: "/agenda", icon: `CalendarDays` (import from lucide-react). Position: after "Tâches", before "Calendrier".
  - Create `frontend/src/components/agenda/oauth-settings.tsx`:
    - Panel showing connected providers with status (connected/disconnected)
    - "Connecter" button per provider (Zoom, Google Calendar, Outlook)
    - Uses popup OAuth flow (same pattern as `use-oauth-email.ts`)
    - "Déconnecter" button for connected providers with confirmation dialog
    - Provider logos: Zoom (video icon), Google Calendar (google icon), Outlook (microsoft icon)
  - Create `frontend/src/hooks/agenda/use-agenda-oauth.ts`:
    - Hook managing OAuth popup flow for agenda providers
    - `connectProvider(provider)` → opens OAuth popup
    - `disconnectProvider(connectionId)` → calls disconnect gRPC
    - `connections` → list of user's connections
    - Follow `use-oauth-email.ts` pattern exactly
  - Add OAuth settings as a tab or section in the `/agenda` page (e.g., "Paramètres" tab or gear icon)
  - Show "Connectez vos calendriers" CTA in empty state when no providers connected

  **Must NOT do**:
  - Don't build full settings page (timezone, preferences, notification config)
  - Don't implement calendar sync UI yet (just connection management)
  - Don't add settings to the global `/parametres` page — keep in `/agenda`

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component work — OAuth connection cards, sidebar item, empty states
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Consistent UI with existing OAuth patterns (email accounts)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 8)
  - **Blocks**: Task 6
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `frontend/src/components/app-sidebar.tsx:42-93` — NAV_ITEMS array structure
  - `frontend/src/hooks/ai/use-oauth-email.ts` — OAuth popup flow pattern (open window, poll for callback, handle tokens)
  - `frontend/src/components/email-account-settings-dialog.tsx` — OAuth account management UI pattern (connect, disconnect, status display)
  - `frontend/src/components/oauth-email-connect.tsx` — OAuth provider selection UI with logos

  **Acceptance Criteria**:

  - [ ] "Agenda" item visible in sidebar with CalendarDays icon
  - [ ] Clicking "Agenda" navigates to `/agenda`
  - [ ] OAuth settings section visible on `/agenda` page
  - [ ] 3 provider cards shown: Zoom, Google Calendar, Outlook
  - [ ] "Connecter" button opens OAuth popup (or shows error if no backend)
  - [ ] Connected providers show green status + "Déconnecter" button
  - [ ] Empty state CTA "Connectez vos calendriers" shown when no connections
  - [ ] `bun run type-check` passes

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Sidebar shows Agenda item
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:3000
    Steps:
      1. Navigate to: http://localhost:3000/
      2. Wait for: sidebar visible (timeout: 5s)
      3. Assert: sidebar contains link with text "Agenda"
      4. Assert: Agenda link has CalendarDays icon
      5. Click: "Agenda" link
      6. Assert: URL is /agenda
      7. Screenshot: .sisyphus/evidence/task-4-sidebar-agenda.png
    Expected Result: Agenda item in sidebar navigates to /agenda
    Evidence: .sisyphus/evidence/task-4-sidebar-agenda.png

  Scenario: OAuth settings show 3 providers
    Tool: Playwright (playwright skill)
    Preconditions: On /agenda page
    Steps:
      1. Navigate to: http://localhost:3000/agenda
      2. Find and click settings/configuration section
      3. Assert: Zoom provider card visible
      4. Assert: Google Calendar provider card visible
      5. Assert: Outlook provider card visible
      6. Assert: Each card has "Connecter" button
      7. Screenshot: .sisyphus/evidence/task-4-oauth-settings.png
    Expected Result: All 3 OAuth provider cards displayed
    Evidence: .sisyphus/evidence/task-4-oauth-settings.png
  ```

  **Commit**: YES
  - Message: `feat(agenda): add sidebar item, OAuth settings UI, and connection hook`
  - Files: `app-sidebar.tsx`, `components/agenda/oauth-settings.tsx`, `hooks/agenda/use-agenda-oauth.ts`

---

- [ ] 5. Calendar Sync Engine (Google Calendar + Outlook — Read-Only)

  **What to do**:
  - Implement `CalendarSyncService` in service-engagement:
    - **Google Calendar sync**:
      - `initialSync(connectionId)` → Fetch all events from primary calendar using Google Calendar API `events.list` with `singleEvents=true` (expand recurring). Store sync token.
      - `incrementalSync(connectionId)` → Use stored `syncToken` to fetch only changed events. Handle 410 Gone → trigger full re-sync.
      - `setupPushChannel(connectionId)` → Create Google Calendar push notification channel (`POST calendars/primary/events/watch`). Store channel_id and expiration in OAuthConnectionEntity.
      - Map Google Calendar event fields to CalendarEventEntity
    - **Outlook Calendar sync (Microsoft Graph)**:
      - `initialSync(connectionId)` → Fetch events from `me/events` with `$deltaToken`. Store delta link.
      - `incrementalSync(connectionId)` → Use delta link for incremental sync. Handle invalid delta → full re-sync.
      - Map Outlook event fields to CalendarEventEntity
    - **Token refresh**: Before each API call, check if access_token is expired → refresh via provider's token endpoint → update encrypted entity
    - **Push notification handler**: HTTP endpoint `POST /webhooks/google-calendar` to receive Google Calendar push notifications → trigger incremental sync
    - **Channel renewal cron**: NestJS `@Cron('0 */6 * * *')` — every 6 hours, check all Google Calendar channels approaching expiration, renew them
    - **Sync cron fallback**: `@Cron('*/15 * * * *')` — every 15 minutes, poll all connections for incremental sync (catch missed webhooks)
  - Implement `CalendarEventService` gRPC methods:
    - `ListByDateRange(userId, start, end)` → Query local DB for cached events
    - `SyncFromProvider(connectionId)` → Trigger manual re-sync
    - `Create(event)` → Create CRM-native event (source = CRM)
    - `Update`, `Delete` — Only for CRM-native events
  - Create HTTP controller: `services/service-engagement/src/infrastructure/http/webhooks/google-calendar-webhook.controller.ts`
    - Verify `X-Goog-Resource-State` and `X-Goog-Channel-ID` headers
    - On `sync` or `update` → trigger incremental sync for matching connection

  **Must NOT do**:
  - Don't implement write-back to external calendars (read-only sync)
  - Don't implement Zoom webhook receivers yet (Task 7)
  - Don't implement AI summarization yet (Task 7)
  - Don't implement Google Pub/Sub for Meet events yet (Task 7)

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Complex external API integration with sync tokens, channel management, cron jobs, edge case handling (410 Gone, token refresh)
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Complex feature implementation in existing NestJS service

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 6)
  - **Blocks**: Task 7
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `services/service-engagement/src/infrastructure/persistence/typeorm/repositories/engagement/mailbox.service.ts` — Service pattern with EncryptionService dependency
  - `services/service-engagement/src/infrastructure/messaging/nats/handlers/` — NATS handler pattern for async operations
  - `services/service-engagement/src/infrastructure/websocket/notification.gateway.ts` — WebSocket gateway for emitting events

  **External References**:
  - Google Calendar Events API: `https://developers.google.com/calendar/api/v3/reference/events`
  - Google Calendar Push Notifications: `https://developers.google.com/calendar/api/guides/push`
  - Microsoft Graph Calendar Delta: `https://learn.microsoft.com/en-us/graph/delta-query-events`
  - Microsoft Graph Calendar Events: `https://learn.microsoft.com/en-us/graph/api/calendar-list-events`

  **Acceptance Criteria**:

  - [ ] Google Calendar events fetched and stored in `calendar_events` table
  - [ ] Incremental sync uses sync token (not full re-fetch)
  - [ ] 410 Gone triggers full re-sync without error
  - [ ] Outlook events fetched via Microsoft Graph delta query
  - [ ] Token refresh happens automatically before expired API calls
  - [ ] Google Calendar push channel created and stored
  - [ ] Channel renewal cron runs every 6 hours
  - [ ] Polling fallback cron runs every 15 minutes
  - [ ] `ListByDateRange` returns cached events from DB
  - [ ] CRM-native events can be created, updated, deleted

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: ListByDateRange returns cached events
    Tool: Bash (grpcurl)
    Preconditions: service-engagement running, some events in DB (seeded or from sync)
    Steps:
      1. grpcurl -plaintext -d '{"user_id":"test-user","organisation_id":"test-org","start_date":"2026-02-01T00:00:00Z","end_date":"2026-02-28T23:59:59Z"}' localhost:50051 agenda.CalendarEventService/ListByDateRange
      2. Assert: response has "events" array
      3. Assert: pagination fields present
    Expected Result: Events returned for date range
    Evidence: grpcurl response captured

  Scenario: Create CRM-native event
    Tool: Bash (grpcurl)
    Preconditions: service-engagement running
    Steps:
      1. grpcurl -plaintext -d '{"user_id":"test-user","organisation_id":"test-org","title":"Réunion client","start_time":"2026-02-10T10:00:00Z","end_time":"2026-02-10T11:00:00Z","source":"CRM"}' localhost:50051 agenda.CalendarEventService/Create
      2. Assert: response has "id" field (UUID)
      3. Assert: response.title equals "Réunion client"
      4. Assert: response.source equals "CRM"
    Expected Result: CRM event created with UUID
    Evidence: grpcurl response captured

  Scenario: Token refresh handles expired token
    Tool: Bash
    Preconditions: service-engagement running, connection with expired access_token in DB
    Steps:
      1. Trigger SyncFromProvider for the expired connection
      2. Assert: logs show "Refreshing token for connection {id}"
      3. Assert: no 401 error in logs
      4. Assert: sync completes successfully (or gracefully fails if no real provider)
    Expected Result: Token refreshed before API call
    Evidence: Service logs captured
  ```

  **Commit**: YES
  - Message: `feat(agenda): implement calendar sync engine for Google Calendar and Outlook (read-only)`
  - Files: CalendarSyncService, CalendarEventService, Google Calendar webhook controller, cron jobs

---

- [ ] 6. Frontend Calendar ↔ Backend Integration

  **What to do**:
  - Replace mock data in calendar views with real gRPC data:
    - `page.tsx` Server Component → call `getServerAgendaEvents(startDate, endDate)` via gRPC
    - `agenda-page-client.tsx` → receive real events as props
  - Create server action `getAgendaEvents(startDate, endDate)` in `frontend/src/actions/agenda.ts`
  - Update `calendar-view.tsx` to handle real event data format (from proto types)
  - Add loading states (skeleton calendars while fetching)
  - Add error states (gRPC connection failed, retry button)
  - Add "Synchroniser maintenant" button that triggers `SyncFromProvider` for all connected providers
  - Show provider badges on events (Google Calendar = Google colors, Outlook = purple, CRM = primary)
  - Show connection status indicator: "Dernière sync: il y a 5 min" + green/orange/red dot
  - Handle empty state: "Aucun événement ce mois-ci" vs "Connectez vos calendriers"

  **Must NOT do**:
  - Don't implement event creation form yet (simple placeholder button)
  - Don't implement AI summary display yet (Task 9)
  - Don't implement meeting-specific UI yet (Task 9)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Integrating real data into existing UI + loading/error states
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 5)
  - **Blocks**: Task 9
  - **Blocked By**: Tasks 3, 4

  **References**:

  **Pattern References**:
  - `frontend/src/lib/server/data.ts` — `getServerDashboardData()` pattern for parallel gRPC fetching
  - `frontend/src/app/(main)/calendrier/page.tsx` — Server Component fetching data pattern
  - `frontend/src/components/dashboard/commercial-kpis.tsx` — Loading skeleton + error state + empty state pattern
  - `frontend/src/actions/calendar-admin.ts` — Server actions with `{data, error}` return pattern

  **Acceptance Criteria**:

  - [ ] Calendar shows real events from gRPC (not mock data)
  - [ ] Loading skeleton displayed while fetching
  - [ ] Error state with retry button shown on gRPC failure
  - [ ] "Synchroniser maintenant" button triggers sync
  - [ ] Connection status indicator shown
  - [ ] Provider badges on events match source
  - [ ] Empty states differentiate "no events" vs "no connections"
  - [ ] `bun run type-check` passes

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Calendar loads real events from backend
    Tool: Playwright (playwright skill)
    Preconditions: Dev server + service-engagement running, at least 1 event in DB
    Steps:
      1. Navigate to: http://localhost:3000/agenda
      2. Wait for: [data-testid="calendar-view"] visible (timeout: 10s)
      3. Assert: loading skeleton appears briefly then disappears
      4. Assert: at least 1 event visible on calendar
      5. Assert: event has provider badge
      6. Screenshot: .sisyphus/evidence/task-6-real-events.png
    Expected Result: Real backend events displayed on calendar
    Evidence: .sisyphus/evidence/task-6-real-events.png

  Scenario: Sync button triggers refresh
    Tool: Playwright (playwright skill)
    Preconditions: On /agenda with connected provider
    Steps:
      1. Click: "Synchroniser maintenant" button
      2. Assert: loading indicator appears
      3. Wait for: loading completes (timeout: 15s)
      4. Assert: "Dernière sync:" timestamp updated
      5. Screenshot: .sisyphus/evidence/task-6-sync-button.png
    Expected Result: Sync triggers and updates timestamp
    Evidence: .sisyphus/evidence/task-6-sync-button.png
  ```

  **Commit**: YES
  - Message: `feat(agenda): integrate calendar UI with backend gRPC data`
  - Files: `page.tsx`, `agenda-page-client.tsx`, `calendar-view.tsx`, `actions/agenda.ts`

---

- [ ] 7. Webhook Receivers + AI Summarization Pipeline

  **What to do**:
  - **Zoom Webhook Receiver**:
    - Create HTTP controller: `services/service-engagement/src/infrastructure/http/webhooks/zoom-webhook.controller.ts`
    - `POST /webhooks/zoom` endpoint
    - Implement Zoom URL validation challenge: on `event=endpoint.url_validation`, return `{plainToken, encryptedToken}` (HMAC-SHA256 with webhook secret)
    - Implement signature verification: validate `x-zm-signature` header using HMAC-SHA256
    - Handle `recording.completed` event: extract recording download URLs, store in meeting entity
    - Handle `recording.transcript_completed` event: fetch VTT transcript from download_url (with `download_access_token`), extract text, publish NATS event `agenda.transcript.received`
    - Idempotent processing: check `event_id` or meeting external_id to avoid duplicates
  - **Google Pub/Sub Receiver**:
    - Create HTTP controller: `services/service-engagement/src/infrastructure/http/webhooks/google-pubsub-webhook.controller.ts`
    - `POST /webhooks/google-pubsub` endpoint
    - Decode base64 Pub/Sub message data
    - Handle `google.workspace.meet.transcript.v2.fileGenerated` event: fetch transcript via Google Drive API using transcript file ID
    - Handle `google.workspace.meet.recording.v2.fileGenerated` event: store recording URL
    - Publish NATS event `agenda.transcript.received` with transcript text
  - **NATS AI Pipeline** (async summarization):
    - Create consumer: `services/service-engagement/src/infrastructure/messaging/nats/handlers/transcript-summary.handler.ts`
    - Subscribe to `agenda.transcript.received`
    - On message: update meeting status to PROCESSING → call AI service at `localhost:8000/ai/generate` with structured prompt → parse response → create CallSummaryEntity → update meeting status to COMPLETED → emit WebSocket notification `meeting:summary-ready`
    - AI prompt template:
      ```
      Analyse cette transcription d'appel et génère un résumé structuré en JSON:
      {
        "executive_summary": "2-3 phrases de synthèse",
        "key_points": ["point 1", "point 2", ...],
        "decisions": ["décision 1", ...],
        "action_items": ["action 1 (responsable: X)", ...]
      }

      Transcription:
      {transcript_text}
      ```
    - Handle AI service down: set status to FAILED, schedule retry via NATS with exponential backoff (1min, 5min, 30min)
    - Handle very long transcripts (>50K tokens): truncate to last 30K tokens with note "Transcript tronqué"
  - **Meeting Creation from Webhooks**:
    - On `recording.completed` / Meet event: create MeetingEntity, attempt to link to CalendarEventEntity by matching time window + title
    - Auto-match participants by email: query `clients` gRPC service for each participant email → populate MeetingParticipant.client_base_id

  **Must NOT do**:
  - Don't build a bot that joins meetings
  - Don't store full transcript in DB (only URL + AI summary)
  - Don't implement transcript editing UI
  - Don't implement custom AI prompt configuration

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Security-critical webhook verification, complex async pipeline (NATS + AI + WebSocket), multiple external APIs
  - **Skills**: [`microservice-maintainer`]
    - `microservice-maintainer`: Complex backend feature in existing NestJS service

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (with Task 9, but Task 9 depends on this)
  - **Blocks**: Task 9
  - **Blocked By**: Task 5

  **References**:

  **Pattern References**:
  - `services/service-engagement/src/infrastructure/websocket/notification.gateway.ts` — WebSocket event emission pattern
  - `services/service-engagement/src/infrastructure/messaging/nats/handlers/` — NATS subscription handler pattern (OnModuleInit, subscribeProto)
  - `services/service-engagement/src/infrastructure/grpc/notification.controller.ts` — gRPC controller invoking WebSocket gateway

  **External References**:
  - Zoom Webhook Validation: `https://developers.zoom.us/docs/api-reference/webhook-reference/#verify-webhook-events`
  - Zoom Recording Webhooks: `https://developers.zoom.us/docs/api-reference/webhook-reference/#recording-events`
  - Google Workspace Events API: `https://developers.google.com/workspace/events/overview`
  - Google Meet Conference Records: `https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords`

  **Acceptance Criteria**:

  - [ ] Zoom URL validation challenge responds correctly
  - [ ] Zoom webhook with valid signature → 200, invalid → 401
  - [ ] `recording.transcript_completed` → MeetingEntity created with transcript_url + NATS event published
  - [ ] Google Pub/Sub message decoded and processed
  - [ ] NATS consumer calls AI service and creates CallSummary
  - [ ] Meeting status transitions: PENDING → PROCESSING → COMPLETED
  - [ ] WebSocket `meeting:summary-ready` emitted on completion
  - [ ] AI service down → status FAILED, retry scheduled
  - [ ] Duplicate webhook events processed idempotently (no duplicate meetings)
  - [ ] Participants auto-matched to CRM clients by email

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Zoom URL validation challenge
    Tool: Bash (curl)
    Preconditions: service-engagement running on port 3061
    Steps:
      1. curl -s -X POST http://localhost:3061/webhooks/zoom \
           -H "Content-Type: application/json" \
           -d '{"event":"endpoint.url_validation","payload":{"plainToken":"test123"}}'
      2. Assert: HTTP status 200
      3. Assert: response has "plainToken":"test123"
      4. Assert: response has "encryptedToken" field (non-empty hex string)
    Expected Result: Challenge response with HMAC signature
    Evidence: Response body captured

  Scenario: Zoom webhook with invalid signature rejected
    Tool: Bash (curl)
    Preconditions: service-engagement running
    Steps:
      1. curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3061/webhooks/zoom \
           -H "Content-Type: application/json" \
           -H "x-zm-signature: v0=invalid_signature" \
           -H "x-zm-request-timestamp: 1234567890" \
           -d '{"event":"recording.completed","payload":{}}'
      2. Assert: HTTP status is 401
    Expected Result: Unauthorized response for invalid signature
    Evidence: HTTP status code captured

  Scenario: AI summarization pipeline processes transcript
    Tool: Bash
    Preconditions: service-engagement running, AI service on localhost:8000, NATS running
    Steps:
      1. Seed a meeting in DB with status PENDING and a mock transcript URL
      2. Publish NATS event `agenda.transcript.received` with meeting_id and transcript text
      3. Wait 30 seconds for async processing
      4. Query meeting via grpcurl: agenda.MeetingService/Get
      5. Assert: meeting.summary_status is "COMPLETED" or "PROCESSING"
      6. If COMPLETED: query agenda.CallSummaryService/GetByMeeting
      7. Assert: summary has executive_summary, key_points, decisions, action_items
    Expected Result: AI summary generated from transcript
    Evidence: grpcurl responses captured
  ```

  **Commit**: YES
  - Message: `feat(agenda): implement webhook receivers (Zoom + Google Pub/Sub) and AI summarization pipeline`
  - Files: Webhook controllers, NATS handler, meeting service logic

---

- [ ] 8. Documentation — OAUTH_SETUP_AGENDA.md

  **What to do**:
  - Create `docs/OAUTH_SETUP_AGENDA.md` with step-by-step setup instructions for:
    - **Zoom Marketplace App**:
      - Create Server-to-Server OAuth app (for webhooks) + User-Level OAuth app (for per-user auth)
      - Required scopes: `recording:read`, `user:read:email`, `meeting:read`
      - Webhook subscription setup: events to subscribe (`recording.completed`, `recording.transcript_completed`)
      - Webhook URL: `https://your-domain.com/webhooks/zoom`
      - Secret token configuration
      - Env vars: `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_WEBHOOK_SECRET_TOKEN`
    - **Google Cloud Console**:
      - Create OAuth 2.0 credentials
      - Enable APIs: Google Calendar API, Google Meet REST API, Google Drive API
      - Required scopes: `calendar.readonly`, `meetings.space.readonly`, `drive.readonly`
      - Google Cloud Pub/Sub setup: create topic, create push subscription pointing to `https://your-domain.com/webhooks/google-pubsub`
      - Workspace Events API subscription setup for Meet events
      - Env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_PUBSUB_TOPIC`
      - **Important**: Document that Google Meet transcripts require Workspace Business Standard+ ($12/user/mo)
    - **Microsoft Azure (Entra ID)**:
      - Register app in Azure Portal
      - Required scopes: `Calendars.Read`, `OnlineMeetings.Read`, `offline_access`
      - Redirect URI configuration
      - Env vars: `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`
    - **Prerequisites section**: Cloud recording enabled on Zoom, Google Workspace edition requirements
    - **Troubleshooting section**: Common OAuth errors, token refresh issues, webhook delivery failures

  **Must NOT do**:
  - Don't write code — documentation only
  - Don't include actual secrets/credentials in the doc

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Pure documentation task
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4)
  - **Blocks**: None
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `frontend/OAUTH_SETUP.md` — Existing OAuth setup documentation pattern for email

  **External References**:
  - Zoom Marketplace: `https://marketplace.zoom.us/develop/create`
  - Google Cloud Console: `https://console.cloud.google.com/apis/credentials`
  - Microsoft Entra ID: `https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps`

  **Acceptance Criteria**:

  - [ ] File `docs/OAUTH_SETUP_AGENDA.md` exists
  - [ ] Zoom setup section with exact steps and screenshots references
  - [ ] Google setup section with Pub/Sub configuration
  - [ ] Microsoft setup section with Azure Portal steps
  - [ ] Prerequisites section mentioning Workspace Business Standard+ requirement
  - [ ] Troubleshooting section with common issues
  - [ ] No actual secrets or credentials in the document

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Documentation file exists and is well-structured
    Tool: Bash
    Preconditions: Task completed
    Steps:
      1. Assert: file docs/OAUTH_SETUP_AGENDA.md exists
      2. Assert: file contains "# " heading
      3. Assert: file contains "Zoom" section
      4. Assert: file contains "Google" section
      5. Assert: file contains "Microsoft" section
      6. Assert: file contains "ZOOM_CLIENT_ID" env var reference
      7. Assert: file contains "Workspace Business Standard" prerequisite
      8. Assert: file does NOT contain any actual secret values
    Expected Result: Complete documentation with all providers
    Evidence: File content verified
  ```

  **Commit**: YES (groups with nearest available commit)
  - Message: `docs(agenda): add OAuth setup guide for Zoom, Google, and Microsoft`
  - Files: `docs/OAUTH_SETUP_AGENDA.md`

---

- [ ] 9. Frontend Meeting Detail + AI Summary Display

  **What to do**:
  - Enhance `event-detail-panel.tsx` to display meeting-specific information:
    - If event has linked meeting: show meeting section with:
      - Duration, participants list with avatars/initials
      - Recording link (external to Zoom/Meet)
      - Transcript link (external to Zoom/Meet)
      - AI Summary section
    - AI Summary display:
      - **Résumé exécutif** : Paragraph text
      - **Points clés** : Bulleted list
      - **Décisions prises** : Bulleted list with checkmark icons
      - **Actions à suivre** : Bulleted list with arrow icons + responsible person highlighted
    - Summary status states:
      - `PENDING` / `PROCESSING` : Skeleton + "Résumé en cours de génération..." with spinner
      - `COMPLETED` : Full summary displayed
      - `FAILED` : "Résumé indisponible" with "Réessayer" button (calls `Regenerate` gRPC)
      - `NO_TRANSCRIPT` : "Pas de transcription disponible. Activez l'enregistrement cloud dans vos paramètres Zoom/Meet."
    - Participants matching display:
      - Matched participants: show client name as link (but DON'T navigate to client page per guardrails)
      - Unmatched participants: show email with "Associer à un client" dropdown
      - Manual override: select different client from search dropdown
  - Create `frontend/src/hooks/agenda/use-meeting-summary.ts`:
    - Real-time updates via WebSocket: listen to `meeting:summary-ready` event
    - Auto-refresh summary when event received
  - Add WebSocket event to `frontend/src/contexts/notification-context.tsx`:
    - Add `meeting:summary-ready` event listener
  - Create `frontend/src/components/agenda/meeting-summary.tsx` — Standalone summary display component
  - Create `frontend/src/components/agenda/participant-matcher.tsx` — Client matching UI

  **Must NOT do**:
  - Don't add summary to client timeline (ONLY in agenda)
  - Don't implement transcript viewer (only link to external)
  - Don't implement sentiment analysis display
  - Don't navigate to client pages from participant links

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Rich UI component with multiple states, real-time updates, interactive matching
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs Task 7 backend)
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 6, 7

  **References**:

  **Pattern References**:
  - `frontend/src/components/dashboard/greeting-briefing.tsx` — Streaming/loading content with skeleton pattern
  - `frontend/src/contexts/notification-context.tsx` — WebSocket event listener pattern (socket.on)
  - `frontend/src/components/dashboard/activity-feed.tsx` — Real-time updates via notifications context
  - `frontend/src/components/agenda/event-detail-panel.tsx` — Existing panel to enhance (from Task 2)

  **Acceptance Criteria**:

  - [ ] Meeting events show meeting-specific section in detail panel
  - [ ] AI summary displays all 4 sections (executive, key points, decisions, actions)
  - [ ] PENDING/PROCESSING status shows skeleton + spinner
  - [ ] COMPLETED status shows full summary
  - [ ] FAILED status shows retry button
  - [ ] NO_TRANSCRIPT shows informative message about enabling recording
  - [ ] "Réessayer" button triggers Regenerate gRPC call
  - [ ] WebSocket `meeting:summary-ready` auto-refreshes summary
  - [ ] Participants show matched/unmatched status
  - [ ] Manual client matching dropdown works
  - [ ] `bun run type-check` passes

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Meeting event shows AI summary
    Tool: Playwright (playwright skill)
    Preconditions: Dev server + backend running, meeting with COMPLETED summary in DB
    Steps:
      1. Navigate to: http://localhost:3000/agenda
      2. Click: event linked to a meeting with completed summary
      3. Wait for: [data-testid="event-detail-panel"] visible (timeout: 5s)
      4. Assert: "Résumé exécutif" section visible with text
      5. Assert: "Points clés" section visible with bullet items
      6. Assert: "Décisions prises" section visible
      7. Assert: "Actions à suivre" section visible
      8. Screenshot: .sisyphus/evidence/task-9-ai-summary.png
    Expected Result: Full AI summary displayed in event panel
    Evidence: .sisyphus/evidence/task-9-ai-summary.png

  Scenario: Processing status shows loading state
    Tool: Playwright (playwright skill)
    Preconditions: Meeting with status PROCESSING in DB
    Steps:
      1. Navigate to: /agenda and click meeting event
      2. Assert: skeleton/spinner visible in summary section
      3. Assert: text "Résumé en cours de génération" visible
      4. Screenshot: .sisyphus/evidence/task-9-processing-state.png
    Expected Result: Loading state for in-progress summary
    Evidence: .sisyphus/evidence/task-9-processing-state.png

  Scenario: Failed summary shows retry button
    Tool: Playwright (playwright skill)
    Preconditions: Meeting with status FAILED in DB
    Steps:
      1. Navigate to: /agenda and click meeting event
      2. Assert: "Résumé indisponible" text visible
      3. Assert: "Réessayer" button visible
      4. Click: "Réessayer" button
      5. Assert: status changes to loading/processing
      6. Screenshot: .sisyphus/evidence/task-9-failed-retry.png
    Expected Result: Retry button triggers regeneration
    Evidence: .sisyphus/evidence/task-9-failed-retry.png

  Scenario: Participant matching shows clients
    Tool: Playwright (playwright skill)
    Preconditions: Meeting with matched and unmatched participants
    Steps:
      1. Open meeting event detail
      2. Assert: matched participant shows client name
      3. Assert: unmatched participant shows email + "Associer à un client" dropdown
      4. Click: "Associer à un client" dropdown for unmatched participant
      5. Assert: client search dropdown opens
      6. Screenshot: .sisyphus/evidence/task-9-participant-matching.png
    Expected Result: Participant matching UI functional
    Evidence: .sisyphus/evidence/task-9-participant-matching.png
  ```

  **Commit**: YES
  - Message: `feat(agenda): add meeting detail panel with AI summary display and participant matching`
  - Files: `meeting-summary.tsx`, `participant-matcher.tsx`, `event-detail-panel.tsx`, `use-meeting-summary.ts`, `notification-context.tsx`

---

- [ ] 10. Client Matching + Notifications + Polish

  **What to do**:
  - **Client Matching Service** (backend):
    - Implement `MatchParticipants(meeting_id, participant_emails)` in MeetingService:
      - Query `clients` gRPC service for each email → find matching `ClientBase` by email field
      - Return match results with confidence: `EMAIL_EXACT` if found, `UNMATCHED` if not
    - Implement `UpdateClientMatch(meeting_id, participant_email, client_base_id, is_manual_override)`:
      - Update participant's client_base_id in meeting.participants JSONB
      - Set `is_manual_override: true` to survive re-syncs
    - Auto-trigger matching when meeting is created from webhook
  - **Notifications**:
    - Add notification type `NOTIFICATION_TYPE_MEETING_SUMMARY_READY = 11` to notifications proto
    - When summary completes: create notification entity + emit WebSocket event
    - Notification message: "Résumé disponible : {meeting_title}" with link to `/agenda?event={id}`
    - Show in activity feed on home page (Zone 3) as new event type `meeting:summary-ready`
  - **Frontend Notifications**:
    - Add `meeting:summary-ready` handler in `notification-context.tsx` (if not already done in Task 9)
    - Update `activity-feed.tsx` to handle new event type with appropriate icon (Sparkles from lucide)
  - **Polish & Edge Cases**:
    - Handle Google Workspace < Business Standard: detect during OAuth (check `hd` claim), show clear message about transcript limitations
    - Handle Zoom without cloud recording: show message in meeting detail "Enregistrement cloud requis pour le résumé IA"
    - Error boundary around calendar component
    - Loading states for all async operations
    - Empty states for all lists
    - Verify `bun run type-check` passes across entire frontend

  **Must NOT do**:
  - Don't add meeting summaries to client timeline
  - Don't send email notifications
  - Don't implement team/multi-user calendar views

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Cross-cutting concerns (backend matching, notifications, frontend polish) — integration task
  - **Skills**: [`microservice-maintainer`, `frontend-ui-ux`]
    - `microservice-maintainer`: Backend matching logic + notification integration
    - `frontend-ui-ux`: Frontend notification handling + polish

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 5 (final)
  - **Blocks**: None (final task)
  - **Blocked By**: Task 9

  **References**:

  **Pattern References**:
  - `services/service-engagement/src/infrastructure/grpc/notification.controller.ts` — Creating notifications + WebSocket broadcast
  - `packages/proto/src/notifications/notifications.proto` — NotificationType enum (add new value)
  - `frontend/src/contexts/notification-context.tsx` — Business event handlers (client:new, contrat:new pattern)
  - `frontend/src/components/dashboard/activity-feed.tsx` — Activity feed event type handling

  **API/Type References**:
  - `packages/proto/src/clients/clients.proto` — ClientBase message with email field for matching
  - `frontend/src/lib/grpc/clients/` — gRPC client for querying clients service

  **Acceptance Criteria**:

  - [ ] `MatchParticipants` returns matches for known emails
  - [ ] `UpdateClientMatch` persists manual override
  - [ ] Notification created when summary completes
  - [ ] WebSocket `meeting:summary-ready` delivered to user
  - [ ] Activity feed shows new summary event with Sparkles icon
  - [ ] Google Workspace limitation detected and displayed
  - [ ] Zoom cloud recording message shown when no recording
  - [ ] Error boundary catches and displays calendar errors gracefully
  - [ ] All loading and empty states present
  - [ ] `bun run type-check` passes for entire frontend

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Participant matching finds CRM client
    Tool: Bash (grpcurl)
    Preconditions: service-engagement + service-core running, client with email "client@example.com" in DB
    Steps:
      1. Create meeting with participant email "client@example.com"
      2. grpcurl -plaintext -d '{"meeting_id":"<id>","participant_emails":["client@example.com","unknown@external.com"]}' localhost:50051 agenda.MeetingService/MatchParticipants
      3. Assert: response has match for "client@example.com" with match_type "EMAIL_EXACT" and client_base_id
      4. Assert: response has match for "unknown@external.com" with match_type "UNMATCHED"
    Expected Result: Known email matched, unknown email unmatched
    Evidence: grpcurl response captured

  Scenario: Summary notification appears in activity feed
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, WebSocket connected, summary just completed
    Steps:
      1. Navigate to: http://localhost:3000/ (home page)
      2. Wait for: [data-testid="zone-activity"] visible
      3. Assert: activity feed contains item with "Résumé disponible" text
      4. Assert: item has Sparkles icon
      5. Screenshot: .sisyphus/evidence/task-10-notification-feed.png
    Expected Result: Summary notification in home activity feed
    Evidence: .sisyphus/evidence/task-10-notification-feed.png

  Scenario: Complete end-to-end flow verification
    Tool: Playwright (playwright skill)
    Preconditions: All services running, at least one provider connected, meeting with summary in DB
    Steps:
      1. Navigate to: http://localhost:3000/agenda
      2. Assert: sidebar "Agenda" item is active
      3. Assert: calendar view shows events
      4. Click: a meeting event
      5. Assert: event detail panel opens
      6. Assert: AI summary section visible with content
      7. Assert: participants listed with match status
      8. Navigate to: / (home page)
      9. Assert: activity feed shows meeting-related events
      10. Screenshot: .sisyphus/evidence/task-10-e2e-final.png
    Expected Result: Full feature works end-to-end
    Evidence: .sisyphus/evidence/task-10-e2e-final.png
  ```

  **Commit**: YES
  - Message: `feat(agenda): add client matching, notifications, and final polish`
  - Files: Meeting matching logic, notification proto update, activity feed update, edge case handling

---

## Commit Strategy

| After Task | Message | Verification |
|------------|---------|--------------|
| 1 | `feat(agenda): add proto definitions, entities, migrations, and gRPC stubs` | `buf generate` + service starts |
| 2 | `feat(agenda): create calendar UI with month/week/day views and mock data` | `bun run type-check` + Playwright |
| 3 | `feat(agenda): implement OAuth flows for Zoom, Google, and Microsoft` | grpcurl GetAuthUrl tests |
| 4 | `feat(agenda): add sidebar item, OAuth settings UI, and connection hook` | Playwright sidebar + settings |
| 5 | `feat(agenda): implement calendar sync engine (read-only)` | grpcurl ListByDateRange |
| 6 | `feat(agenda): integrate calendar UI with backend gRPC data` | Playwright real events |
| 7 | `feat(agenda): implement webhook receivers and AI summarization pipeline` | curl webhook tests |
| 8 | `docs(agenda): add OAuth setup guide for Zoom, Google, and Microsoft` | File exists + structured |
| 9 | `feat(agenda): add meeting detail with AI summary and participant matching UI` | Playwright summary display |
| 10 | `feat(agenda): add client matching, notifications, and final polish` | E2E full flow |

---

## Success Criteria

### Verification Commands
```bash
# Proto compilation
cd packages/proto && buf generate  # Expected: exit 0

# Service starts
cd services/service-engagement && bun run start:dev  # Expected: "SERVICE-ENGAGEMENT STARTED" with agenda

# gRPC services registered
grpcurl -plaintext localhost:50051 list  # Expected: agenda.* services visible

# Frontend type-check
cd frontend && bun run type-check  # Expected: exit 0

# Frontend page loads
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/agenda  # Expected: 200
```

### Final Checklist
- [ ] All "Must Have" features implemented and functional
- [ ] All "Must NOT Have" guardrails respected (no bidirectional sync, no client timeline, etc.)
- [ ] All 3 OAuth providers connectable (Zoom, Google, Microsoft)
- [ ] Calendar sync works for Google Calendar and Outlook (read-only)
- [ ] Zoom webhook processes recording events
- [ ] Google Pub/Sub receives Meet events
- [ ] AI summarization pipeline generates structured summaries
- [ ] Client matching works automatically + manual override
- [ ] All loading, error, and empty states present
- [ ] Dark mode fully supported
- [ ] TypeScript passes without errors
- [ ] OAUTH_SETUP_AGENDA.md documentation complete
