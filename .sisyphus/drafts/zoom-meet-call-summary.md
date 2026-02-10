# Draft: Résumé d'Appels Zoom/Meet

## Requirements (confirmés)
- **Plateformes** : Zoom + Google Meet
- **Workflow** : Automatique après chaque appel (webhook détecte fin d'appel → récupère transcript → génère résumé → rattache au client)
- **Affichage** : Dans le calendrier du CRM
- **Service IA** : Utiliser le service existant sur localhost:8000 (SSE streaming)

## Technical Decisions
- **Architecture** : Event-driven (webhooks Zoom/Meet → processing async → IA résumé → sync CRM)
- **Webhook + Polling hybride** : Webhooks pour temps réel + polling fallback (fiabilité)
- **Zoom API** : Webhook `session.recording_transcript_completed` → télécharger transcript VTT → résumer
- **Google Meet API** : Workspace Events API pour push notifications → `conferenceRecords/{id}/transcripts`
- **IA Summarization** : 2-stage (extraction key points → résumé exécutif) via service existant localhost:8000

## Research Findings (AI Service Existant)
- **Endpoint IA** : `GET /ai/generate?q={query}&session_id={sessionId}` avec SSE streaming
- **Health** : `GET /ai/health` → `{ online: boolean }`
- **Pattern** : fetch + ReadableStream + TextDecoder, tokens JSON `{token, is_final}`
- **Auth** : Bearer token optionnel
- **Activités** : Proto `Activite` avec `client_base_id`, `contrat_id`, `sujet`, `commentaire`
- **Notifications** : WebSocket Socket.io, événements business typés, gRPC service
- **Tâches** : Proto `Tache` avec assignation, client_id, metadata JSON

## Research Findings (APIs Externes)
- **Zoom** : Webhooks matures (`recording.completed`, `transcript.completed`), transcript en VTT, signature verification
- **Google Meet** : Conference Records API, Workspace Events API pour push, transcripts par endpoint REST
- **Pattern CRM** : Bot rejoint meeting → enregistre → webhook fin → IA résume → sync CRM
- **Chunking** : Speaker-turn chunking recommandé pour meetings (2-5 min segments)
- **RGPD** : Consentement explicite obligatoire, chiffrement, rétention limitée, droit à l'effacement

## Decisions confirmées (round 2)
- **Scope MVP** : Les deux plateformes (Zoom + Google Meet) en même temps
- **Auth OAuth** : Chaque utilisateur connecte individuellement son compte
- **RGPD** : Pas de gestion dans le CRM pour le MVP (consentement géré côté Zoom/Meet)
- **Contenu résumé** : Résumé exécutif + Points clés + Décisions prises + Actions à suivre (PAS de sentiment)

## Découverte critique : Calendrier existant
- Le calendrier `/calendrier` est un **calendrier de prélèvements financiers** (debits), PAS un agenda
- Custom-built (pas de lib externe), affiche des PlannedDebit par date
- Pas de concept meeting/rendez-vous, pas d'événements horaires
- Pas d'intégration Google Calendar/Outlook
- **CONSÉQUENCE** : Il faut soit créer un nouveau module "Agenda/Meetings", soit afficher les résumés ailleurs

## Decisions confirmées (round 3)
- **Affichage** : Créer un VRAI module agenda/calendrier (type Google Calendar) — pas juste afficher dans la fiche client
- **Matching appel→client** : Automatique par email + correction manuelle possible
- **Stockage** : Juste le résumé IA en DB. Transcript complet reste chez Zoom/Meet (lien URL)
- **Conséquence** : Le scope inclut maintenant un nouveau module Agenda complet + intégration Zoom/Meet + IA résumé

## Decisions confirmées (round 4)
- **Scope agenda** : Agenda COMPLET — sync bidirectionnelle Google Calendar/Outlook + création RDV dans CRM + appels Zoom/Meet + résumés IA
- **Fiche client** : NON — résumé visible uniquement dans le module agenda (pas dans la timeline client)
- **Navigation** : Nouvelle entrée menu "Agenda" dans le sidebar → route `/agenda`
- **Plan** : Un seul plan complet (pas de phases séparées)
- **OAuth** : Apps pas encore créées — inclure instructions de setup dans le plan
- **Service backend** : service-engagement (déjà gère activités, notifications, tâches)

## Architecture décidée
1. **Backend (service-engagement)** :
   - Nouveau module Agenda : entités Meeting, CalendarEvent, OAuthToken
   - gRPC endpoints : CRUD events, sync calendriers, webhook receivers Zoom/Meet
   - OAuth flow : Zoom OAuth 2.0 + Google OAuth 2.0 (par utilisateur)
   - Webhook handlers : Zoom `recording.completed` + Google Workspace Events
   - IA pipeline : Récupérer transcript → chunker → appeler localhost:8000 → stocker résumé

2. **Frontend** :
   - Nouvelle page `/agenda` avec vue calendrier (semaine/mois/jour)
   - Lib calendrier à choisir (FullCalendar, react-big-calendar, custom)
   - Panel détail événement avec résumé IA
   - Settings : connexion OAuth Zoom/Meet, paramètres sync
   - Sidebar : nouvel item "Agenda"

3. **Infra** :
   - Nouvelles tables : meetings, calendar_events, oauth_tokens, call_summaries
   - Migrations TypeORM
   - Variables d'env pour OAuth credentials

## Open Questions
(Aucune question bloquante restante — prêt pour génération du plan)

## Scope Boundaries
- INCLUDE : Webhook receiver, processing pipeline, IA summarization, affichage calendrier, notifications
- EXCLUDE : Bot qui rejoint les meetings (trop complexe pour MVP), enregistrement direct (on utilise les recordings Zoom/Meet natifs)
