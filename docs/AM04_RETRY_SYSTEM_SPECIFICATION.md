# AM04 Retry System - Complete Technical Specification

## Table of Contents

1. [Overview](#1-overview)
2. [Scheduler Specification](#2-scheduler-specification)
3. [State Machines](#3-state-machines)
4. [Database Model](#4-database-model)
5. [Alerting & Monitoring Strategy](#5-alerting--monitoring-strategy)
6. [Test Plan](#6-test-plan)
7. [Concrete Scenarios](#7-concrete-scenarios)

---

## 1. Overview

### 1.1 Purpose

This system handles payment rejection retries (specifically AM04 "Account Closed/Invalid") with:
- Configurable retry policies (J+5, J+10, J+20 by default)
- Multi-channel reminders (email, SMS, phone)
- Complete audit trail
- Idempotent operations

### 1.2 Key Principles

| Principle | Implementation |
|-----------|----------------|
| **Protobuf = Source of Truth** | All models, statuses, policies, APIs, events defined in `.proto` files |
| **Zero Manual DTOs** | Types generated from Protobuf for backend (TypeScript) and frontend |
| **CamelCase in Transit** | JSON APIs use camelCase (automatic proto-to-JSON) |
| **snake_case in DB** | TypeORM SnakeNamingStrategy handles conversion |
| **Schema-Derived Validation** | buf.validate / protoc-gen-validate at boundaries |
| **No Silent Errors** | Typed errors + mandatory logging |
| **Complete Audit** | Append-only audit log for all actions |
| **Idempotency** | Unique keys on scheduling, execution, and reminders |

### 1.3 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          PAYMENT SERVICE                                 │
│  (Receives PSP webhooks, emits PaymentRejectedEvent)                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ PaymentRejectedEvent
┌─────────────────────────────────────────────────────────────────────────┐
│                         RETRY SERVICE                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │ RetryScheduler   │  │ RetryAdminService│  │ ReminderService  │      │
│  │ Service          │  │                  │  │                  │      │
│  │                  │  │ - Policy CRUD    │  │ - Policy CRUD    │      │
│  │ - HandleRejection│  │ - Schedule CRUD  │  │ - Reminder CRUD  │      │
│  │ - ProcessDue     │  │ - RunNow         │  │ - ProcessDue     │      │
│  │ - CheckEligibility│ │ - Metrics/Audit  │  │ - SendReminder   │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          ▼                         ▼                         ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  PAYMENT SERVICE │    │   EMAIL SERVICE  │    │   SMS PROVIDER   │
│  (Execute retry) │    │ (Send reminders) │    │   (Twilio, etc.) │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## 2. Scheduler Specification

### 2.1 Retry Selection Algorithm

```typescript
interface RetrySelectionCriteria {
  organisationId: string;
  targetDate: Date;        // Date for which to process retries
  timezone: string;        // e.g., "Europe/Paris"
  cutoffTime: string;      // e.g., "10:00:00" - retries due before this time
}

// Selection Query (pseudo-SQL)
SELECT rs.* FROM retry_schedule rs
WHERE rs.organisation_id = :organisationId
  AND rs.is_resolved = false
  AND rs.eligibility = 'ELIGIBLE'
  AND rs.next_retry_date <= :targetDateWithCutoff
  AND NOT EXISTS (
    -- Idempotency: no attempt already in progress for this schedule
    SELECT 1 FROM retry_attempt ra
    WHERE ra.retry_schedule_id = rs.id
      AND ra.status IN ('IN_PROGRESS', 'SUBMITTED')
  )
  AND NOT EXISTS (
    -- Idempotency: no job already processing this date
    SELECT 1 FROM retry_job rj
    WHERE rj.organisation_id = rs.organisation_id
      AND rj.target_date = :targetDate
      AND rj.status IN ('JOB_PENDING', 'JOB_RUNNING')
  )
ORDER BY rs.next_retry_date ASC, rs.created_at ASC
FOR UPDATE SKIP LOCKED;  -- Prevent concurrent processing
```

### 2.2 Cutoff and Timezone Handling

```typescript
function calculateCutoffTimestamp(
  targetDate: Date,
  timezone: string,
  cutoffTime: string
): Date {
  // Convert target date to timezone
  const dateInTz = toZonedTime(targetDate, timezone);
  
  // Parse cutoff time (HH:mm:ss)
  const [hours, minutes, seconds] = cutoffTime.split(':').map(Number);
  
  // Set time components
  dateInTz.setHours(hours, minutes, seconds, 0);
  
  // Convert back to UTC for database query
  return fromZonedTime(dateInTz, timezone);
}

// Example:
// targetDate: 2026-01-20
// timezone: "Europe/Paris"
// cutoffTime: "10:00:00"
// Result: 2026-01-20T09:00:00Z (UTC) during winter time
```

### 2.3 Idempotency Guarantees

| Entity | Idempotency Key Format | Purpose |
|--------|------------------------|---------|
| RetrySchedule | `{payment_id}:{rejection_date_iso}` | Prevent duplicate schedules for same rejection |
| RetryAttempt | `{schedule_id}:{attempt_number}` | Prevent duplicate attempts |
| RetryJob | `{org_id}:{target_date_iso}:{cutoff}` | Prevent duplicate batch jobs |
| Reminder | `{schedule_id}:{trigger}:{channel}:{trigger_attempt_id}` | Prevent duplicate reminders |

```typescript
// Idempotency check before creating schedule
async function createRetryScheduleIdempotent(
  event: PaymentRejectedEvent
): Promise<RetrySchedule | null> {
  const idempotencyKey = `${event.paymentId}:${event.rejectedAt.toISOString()}`;
  
  // Check for existing
  const existing = await retryScheduleRepo.findOne({
    where: { idempotencyKey }
  });
  
  if (existing) {
    logger.info('Duplicate rejection event ignored', {
      paymentId: event.paymentId,
      idempotencyKey,
      existingScheduleId: existing.id
    });
    return null; // Already processed
  }
  
  // Create with unique constraint on idempotency_key
  try {
    return await retryScheduleRepo.save({
      ...mapEventToSchedule(event),
      idempotencyKey
    });
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      // Race condition: another process created it
      return null;
    }
    throw error;
  }
}
```

### 2.4 Scheduler Execution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCHEDULER EXECUTION FLOW                      │
└─────────────────────────────────────────────────────────────────┘

1. TRIGGER (Cron or Manual)
   │
   ├── Cron: "0 10 * * *" (10:00 AM daily)
   │   └── ProcessDueRetries(org_id, today, "Europe/Paris", "10:00:00")
   │
   └── Manual: Admin clicks "Run Now"
       └── RunNow(org_id, user_id, dry_run=false)

2. CREATE JOB
   │
   ├── Generate idempotency_key: "{org_id}:{date}:{cutoff}"
   ├── Check for existing job with same key
   │   ├── EXISTS + RUNNING → Return "Job already in progress"
   │   └── EXISTS + COMPLETED → Create new job (different execution)
   └── Insert RetryJob(status=JOB_PENDING)

3. SELECT RETRIES
   │
   ├── Query eligible RetrySchedules
   ├── Apply FOR UPDATE SKIP LOCKED
   └── Return list of schedules to process

4. FOR EACH SCHEDULE
   │
   ├── 4.1 RE-CHECK ELIGIBILITY
   │   ├── Check stop conditions (payment settled, contract cancelled, etc.)
   │   ├── If no longer eligible:
   │   │   ├── Update schedule.eligibility
   │   │   ├── Create SKIPPED attempt
   │   │   └── Continue to next
   │   └── If eligible: proceed
   │
   ├── 4.2 CREATE ATTEMPT
   │   ├── Generate idempotency_key: "{schedule_id}:{attempt_number}"
   │   ├── Insert RetryAttempt(status=IN_PROGRESS)
   │   └── Emit RetryScheduledEvent
   │
   ├── 4.3 EXECUTE PAYMENT
   │   ├── Call PaymentService.CreateGoCardlessPayment (or equivalent)
   │   ├── Wait for response
   │   └── Handle result
   │
   ├── 4.4 UPDATE ATTEMPT
   │   ├── SUCCESS:
   │   │   ├── Update attempt.status = SUCCEEDED
   │   │   ├── Update schedule.is_resolved = true
   │   │   ├── Emit RetrySucceededEvent
   │   │   └── Cancel pending reminders
   │   │
   │   └── FAILURE:
   │       ├── Update attempt.status = FAILED
   │       ├── Update attempt.error_code, error_message
   │       ├── Calculate next_retry_date (if attempts remaining)
   │       ├── Update schedule.current_attempt++
   │       ├── If max_attempts reached:
   │       │   ├── Update schedule.is_resolved = true
   │       │   └── Update schedule.eligibility = MAX_ATTEMPTS_REACHED
   │       ├── Emit RetryFailedEvent
   │       └── Trigger failure reminders
   │
   └── 4.5 AUDIT LOG
       └── Create RetryAuditLog entry

5. FINALIZE JOB
   │
   ├── Update job.status (COMPLETED, FAILED, PARTIAL)
   ├── Update job.total_attempts, successful_attempts, etc.
   └── Emit job completion metrics
```

### 2.5 Cron Configuration

```yaml
# Recommended cron schedules
retry_scheduler:
  # Main daily run - processes all due retries
  daily_run:
    schedule: "0 10 * * *"  # 10:00 AM daily
    timezone: "Europe/Paris"
    cutoff_time: "10:00:00"
    
  # Catch-up run for any missed retries
  catchup_run:
    schedule: "0 14 * * *"  # 2:00 PM daily
    timezone: "Europe/Paris"
    cutoff_time: "14:00:00"

reminder_scheduler:
  # Process reminders multiple times per day
  morning:
    schedule: "0 9 * * 1-5"  # 9:00 AM Mon-Fri
  afternoon:
    schedule: "0 14 * * 1-5" # 2:00 PM Mon-Fri
  evening:
    schedule: "0 17 * * 1-5" # 5:00 PM Mon-Fri
```

---

## 3. State Machines

### 3.1 Retry Attempt Lifecycle

```
                    ┌─────────────┐
                    │  SCHEDULED  │
                    └──────┬──────┘
                           │ Scheduler picks up
                           ▼
                    ┌─────────────┐
           ┌────────│ IN_PROGRESS │────────┐
           │        └──────┬──────┘        │
           │               │               │
    Manual │      PSP Call │        Error  │
    Cancel │               │        during │
           │               ▼        call   │
           │        ┌─────────────┐        │
           │        │  SUBMITTED  │        │
           │        └──────┬──────┘        │
           │               │               │
           │    ┌──────────┼──────────┐    │
           │    │          │          │    │
           │    ▼          ▼          ▼    │
           │ ┌─────┐  ┌─────────┐  ┌──────┐│
           │ │SUCC-│  │ FAILED  │  │CANCEL││
           │ │EEDED│  └────┬────┘  │LED   ││
           │ └─────┘       │       └──────┘│
           │               │               │
           └───────────────┴───────────────┘
                           │
                    ┌──────┴──────┐
                    │   SKIPPED   │
                    │ (condition  │
                    │  changed)   │
                    └─────────────┘

Valid State Transitions:
┌──────────────┬─────────────────────────────────────────┐
│ From         │ To                                      │
├──────────────┼─────────────────────────────────────────┤
│ SCHEDULED    │ IN_PROGRESS, CANCELLED, SKIPPED        │
│ IN_PROGRESS  │ SUBMITTED, FAILED, CANCELLED           │
│ SUBMITTED    │ SUCCEEDED, FAILED                      │
│ SUCCEEDED    │ (terminal)                             │
│ FAILED       │ (terminal, may trigger next attempt)   │
│ CANCELLED    │ (terminal)                             │
│ SKIPPED      │ (terminal)                             │
└──────────────┴─────────────────────────────────────────┘
```

### 3.2 Retry Schedule Lifecycle

```
     PaymentRejectedEvent
            │
            ▼
     ┌─────────────────────────────┐
     │ Check Eligibility           │
     └──────┬──────────────────────┘
            │
     ┌──────┴──────┐
     │             │
     ▼             ▼
ELIGIBLE      NOT_ELIGIBLE
     │             │
     │             └──► Schedule created with
     │                  is_resolved=true
     │                  (no retries)
     │
     ▼
Schedule created
current_attempt=0
next_retry_date=J+5
     │
     │ ◄──────────────────────────────────┐
     ▼                                    │
┌──────────────┐                          │
│ Attempt #N   │                          │
│ Executed     │                          │
└──────┬───────┘                          │
       │                                  │
┌──────┴──────┬──────────────┐           │
│             │              │           │
▼             ▼              ▼           │
SUCCESS    FAILURE      CANCELLED        │
   │          │              │           │
   │          │              │           │
   ▼          │              ▼           │
is_resolved   │         is_resolved      │
=true         │         =true            │
              │         eligibility=     │
              │         MANUAL_CANCEL    │
              │                          │
              ▼                          │
       ┌──────────────┐                  │
       │ More attempts │                  │
       │ remaining?    │                  │
       └──────┬───────┘                  │
              │                          │
       ┌──────┴──────┐                   │
       │             │                   │
       ▼             ▼                   │
      YES           NO                   │
       │             │                   │
       │             ▼                   │
       │      is_resolved=true           │
       │      eligibility=               │
       │      MAX_ATTEMPTS_REACHED       │
       │                                 │
       ▼                                 │
  next_retry_date                        │
  = current + delay[N+1]                 │
       │                                 │
       └─────────────────────────────────┘
```

### 3.3 Reminder Lifecycle

```
        Trigger Event
        (AM04 received, retry failed, etc.)
              │
              ▼
       ┌─────────────────┐
       │ Check Rate Limit│
       │ Check Time Window│
       │ Check Opt-out    │
       └──────┬──────────┘
              │
       ┌──────┴──────┐
       │             │
       ▼             ▼
    ALLOWED       BLOCKED
       │             │
       │             └──► No reminder created
       ▼                  (logged)
┌─────────────┐
│   PENDING   │
└──────┬──────┘
       │ Scheduler picks up
       ▼
┌─────────────┐
│   SENDING   │◄─────────────────┐
└──────┬──────┘                  │
       │                         │
┌──────┼──────┬──────────┐      │
│      │      │          │      │
▼      ▼      ▼          ▼      │
SENT  FAILED CANCELLED  BOUNCE  │
 │      │      │          │     │
 │      │      │          │     │
 ▼      │      ▼          ▼     │
DELIV-  │   (terminal)  (terminal)
ERED    │                       │
 │      │                       │
 ▼      │                       │
┌───┐   │    ┌────────────────┐ │
│OPE│   └───►│ Retry count < 3│─┘
│NED│        │ ? Retry : FAIL │
└─┬─┘        └────────────────┘
  │
  ▼
┌───────┐
│CLICKED│
└───────┘

Valid State Transitions:
┌────────────────┬──────────────────────────────────┐
│ From           │ To                               │
├────────────────┼──────────────────────────────────┤
│ PENDING        │ SENT, FAILED, CANCELLED          │
│ SENT           │ DELIVERED, FAILED, BOUNCED       │
│ DELIVERED      │ OPENED                           │
│ OPENED         │ CLICKED                          │
│ FAILED         │ PENDING (retry), (terminal)      │
│ CANCELLED      │ (terminal)                       │
│ BOUNCED        │ (terminal)                       │
│ CLICKED        │ (terminal)                       │
└────────────────┴──────────────────────────────────┘
```

---

## 4. Database Model

### 4.1 Tables Overview

```sql
-- All tables use snake_case
-- TypeORM SnakeNamingStrategy handles camelCase ↔ snake_case conversion

-- ============================================================
-- RETRY POLICY
-- ============================================================
CREATE TABLE retry_policy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL,
    societe_id UUID,
    product_id UUID,
    channel_id UUID,
    
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    
    -- Retry schedule: JSON array of days [5, 10, 20]
    retry_delays_days JSONB NOT NULL DEFAULT '[5, 10, 20]',
    
    max_attempts INT NOT NULL DEFAULT 3,
    max_total_days INT NOT NULL DEFAULT 30,
    
    retry_on_am04 BOOLEAN NOT NULL DEFAULT true,
    retryable_codes JSONB DEFAULT '[]',
    non_retryable_codes JSONB DEFAULT '[]',
    
    stop_on_payment_settled BOOLEAN NOT NULL DEFAULT true,
    stop_on_contract_cancelled BOOLEAN NOT NULL DEFAULT true,
    stop_on_mandate_revoked BOOLEAN NOT NULL DEFAULT true,
    
    backoff_strategy VARCHAR(20) NOT NULL DEFAULT 'FIXED',
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    priority INT NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    CONSTRAINT uq_retry_policy_default 
        UNIQUE (organisation_id, societe_id, is_default) 
        WHERE is_default = true
);

CREATE INDEX idx_retry_policy_org ON retry_policy(organisation_id);
CREATE INDEX idx_retry_policy_societe ON retry_policy(organisation_id, societe_id) WHERE societe_id IS NOT NULL;
CREATE INDEX idx_retry_policy_active ON retry_policy(organisation_id, is_active) WHERE is_active = true;

-- ============================================================
-- RETRY SCHEDULE
-- ============================================================
CREATE TABLE retry_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL,
    societe_id UUID NOT NULL,
    
    -- Source payment reference
    original_payment_id UUID NOT NULL,
    schedule_id UUID NOT NULL,
    facture_id UUID,
    contrat_id UUID,
    client_id UUID NOT NULL,
    
    -- Rejection info
    rejection_code VARCHAR(10) NOT NULL,
    rejection_raw_code VARCHAR(50) NOT NULL,
    rejection_message TEXT,
    rejection_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Policy
    retry_policy_id UUID NOT NULL REFERENCES retry_policy(id),
    
    -- Amount
    amount_cents BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    
    -- Eligibility
    eligibility VARCHAR(50) NOT NULL,
    eligibility_reason TEXT,
    
    -- State
    current_attempt INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL,
    next_retry_date TIMESTAMP WITH TIME ZONE,
    
    -- Resolution
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolution_reason TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Idempotency
    idempotency_key VARCHAR(255) NOT NULL,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    
    CONSTRAINT uq_retry_schedule_idempotency UNIQUE (idempotency_key)
);

CREATE INDEX idx_retry_schedule_org ON retry_schedule(organisation_id);
CREATE INDEX idx_retry_schedule_societe ON retry_schedule(organisation_id, societe_id);
CREATE INDEX idx_retry_schedule_client ON retry_schedule(client_id);
CREATE INDEX idx_retry_schedule_contrat ON retry_schedule(contrat_id) WHERE contrat_id IS NOT NULL;
CREATE INDEX idx_retry_schedule_payment ON retry_schedule(original_payment_id);
CREATE INDEX idx_retry_schedule_due ON retry_schedule(next_retry_date, is_resolved, eligibility) 
    WHERE is_resolved = false AND eligibility = 'ELIGIBLE';
CREATE INDEX idx_retry_schedule_rejection_date ON retry_schedule(rejection_date);

-- ============================================================
-- RETRY ATTEMPT
-- ============================================================
CREATE TABLE retry_attempt (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    retry_schedule_id UUID NOT NULL REFERENCES retry_schedule(id) ON DELETE CASCADE,
    
    attempt_number INT NOT NULL,
    planned_date TIMESTAMP WITH TIME ZONE NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE,
    
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    
    -- Execution
    payment_intent_id UUID,
    psp_payment_id VARCHAR(255),
    psp_response JSONB,
    
    -- Result
    error_code VARCHAR(50),
    error_message TEXT,
    new_rejection_code VARCHAR(10),
    
    -- Job reference
    retry_job_id UUID,
    
    -- Idempotency
    idempotency_key VARCHAR(255) NOT NULL,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_retry_attempt_schedule_number UNIQUE (retry_schedule_id, attempt_number),
    CONSTRAINT uq_retry_attempt_idempotency UNIQUE (idempotency_key)
);

CREATE INDEX idx_retry_attempt_schedule ON retry_attempt(retry_schedule_id);
CREATE INDEX idx_retry_attempt_status ON retry_attempt(status);
CREATE INDEX idx_retry_attempt_job ON retry_attempt(retry_job_id) WHERE retry_job_id IS NOT NULL;
CREATE INDEX idx_retry_attempt_planned ON retry_attempt(planned_date, status) WHERE status = 'SCHEDULED';

-- ============================================================
-- RETRY JOB
-- ============================================================
CREATE TABLE retry_job (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL,
    
    -- Parameters
    target_date DATE NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'Europe/Paris',
    cutoff_time TIME NOT NULL DEFAULT '10:00:00',
    
    -- Execution
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    status VARCHAR(20) NOT NULL DEFAULT 'JOB_PENDING',
    
    -- Results
    total_attempts INT NOT NULL DEFAULT 0,
    successful_attempts INT NOT NULL DEFAULT 0,
    failed_attempts INT NOT NULL DEFAULT 0,
    skipped_attempts INT NOT NULL DEFAULT 0,
    
    -- Errors
    error_message TEXT,
    failed_schedule_ids JSONB DEFAULT '[]',
    
    -- Idempotency
    idempotency_key VARCHAR(255) NOT NULL,
    
    -- Trigger
    triggered_by VARCHAR(255) NOT NULL,
    is_manual BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_retry_job_idempotency UNIQUE (idempotency_key)
);

CREATE INDEX idx_retry_job_org ON retry_job(organisation_id);
CREATE INDEX idx_retry_job_status ON retry_job(status);
CREATE INDEX idx_retry_job_date ON retry_job(target_date);

-- ============================================================
-- REMINDER POLICY
-- ============================================================
CREATE TABLE reminder_policy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL,
    societe_id UUID,
    
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    
    -- Trigger rules (JSON array)
    trigger_rules JSONB NOT NULL DEFAULT '[]',
    
    -- Rate limiting
    cooldown_hours INT NOT NULL DEFAULT 24,
    max_reminders_per_day INT NOT NULL DEFAULT 3,
    max_reminders_per_week INT NOT NULL DEFAULT 10,
    
    -- Time windows
    allowed_start_hour INT NOT NULL DEFAULT 9,
    allowed_end_hour INT NOT NULL DEFAULT 19,
    allowed_days_of_week JSONB NOT NULL DEFAULT '[1,2,3,4,5]',
    
    -- Opt-out
    respect_opt_out BOOLEAN NOT NULL DEFAULT true,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    priority INT NOT NULL DEFAULT 0,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reminder_policy_org ON reminder_policy(organisation_id);
CREATE INDEX idx_reminder_policy_active ON reminder_policy(organisation_id, is_active) WHERE is_active = true;

-- ============================================================
-- REMINDER
-- ============================================================
CREATE TABLE reminder (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL,
    societe_id UUID NOT NULL,
    
    -- References
    retry_schedule_id UUID NOT NULL REFERENCES retry_schedule(id),
    retry_attempt_id UUID REFERENCES retry_attempt(id),
    client_id UUID NOT NULL,
    
    -- Policy
    reminder_policy_id UUID NOT NULL REFERENCES reminder_policy(id),
    trigger_rule_id VARCHAR(255),
    
    -- Channel
    channel VARCHAR(20) NOT NULL,
    template_id VARCHAR(255) NOT NULL,
    template_variables JSONB DEFAULT '{}',
    
    -- Trigger
    trigger VARCHAR(50) NOT NULL,
    
    -- Scheduling
    planned_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'REMINDER_PENDING',
    
    -- Delivery
    provider_name VARCHAR(50),
    provider_message_id VARCHAR(255),
    delivery_status_raw TEXT,
    
    -- Errors
    error_code VARCHAR(50),
    error_message TEXT,
    retry_count INT NOT NULL DEFAULT 0,
    
    -- Idempotency
    idempotency_key VARCHAR(255) NOT NULL,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_reminder_idempotency UNIQUE (idempotency_key)
);

CREATE INDEX idx_reminder_org ON reminder(organisation_id);
CREATE INDEX idx_reminder_schedule ON reminder(retry_schedule_id);
CREATE INDEX idx_reminder_client ON reminder(client_id);
CREATE INDEX idx_reminder_status ON reminder(status);
CREATE INDEX idx_reminder_planned ON reminder(planned_at, status) WHERE status = 'REMINDER_PENDING';
CREATE INDEX idx_reminder_channel ON reminder(channel, status);

-- ============================================================
-- AUDIT LOG (Append-Only)
-- ============================================================
CREATE TABLE retry_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL,
    
    -- What changed
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    
    -- Change details
    old_value JSONB,
    new_value JSONB NOT NULL,
    changed_fields TEXT,
    
    -- Context
    retry_schedule_id UUID,
    retry_attempt_id UUID,
    reminder_id UUID,
    payment_id UUID,
    
    -- Actor
    actor_type VARCHAR(20) NOT NULL,
    actor_id UUID,
    actor_ip INET,
    
    -- Timestamp
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Append-only: no UPDATE or DELETE allowed
-- Implemented via database trigger or application constraint

CREATE INDEX idx_audit_log_org ON retry_audit_log(organisation_id);
CREATE INDEX idx_audit_log_entity ON retry_audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_schedule ON retry_audit_log(retry_schedule_id) WHERE retry_schedule_id IS NOT NULL;
CREATE INDEX idx_audit_log_timestamp ON retry_audit_log(timestamp);
CREATE INDEX idx_audit_log_action ON retry_audit_log(action);

-- Partition by month for performance
-- CREATE TABLE retry_audit_log_2026_01 PARTITION OF retry_audit_log
--     FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

### 4.2 Unique Constraints Summary

| Table | Constraint | Columns | Purpose |
|-------|------------|---------|---------|
| retry_policy | uq_retry_policy_default | org_id, societe_id, is_default (WHERE is_default=true) | Only one default policy per scope |
| retry_schedule | uq_retry_schedule_idempotency | idempotency_key | Prevent duplicate schedules |
| retry_attempt | uq_retry_attempt_schedule_number | retry_schedule_id, attempt_number | Prevent duplicate attempts |
| retry_attempt | uq_retry_attempt_idempotency | idempotency_key | Additional idempotency |
| retry_job | uq_retry_job_idempotency | idempotency_key | Prevent duplicate batch jobs |
| reminder | uq_reminder_idempotency | idempotency_key | Prevent duplicate reminders |

### 4.3 Index Strategy

```sql
-- High-frequency query patterns and their indexes:

-- 1. Get due retries for scheduler
-- Query: WHERE next_retry_date <= ? AND is_resolved = false AND eligibility = 'ELIGIBLE'
-- Index: idx_retry_schedule_due

-- 2. Get retries by client (customer service lookup)
-- Query: WHERE client_id = ?
-- Index: idx_retry_schedule_client

-- 3. Get retries by contract (contract details page)
-- Query: WHERE contrat_id = ?
-- Index: idx_retry_schedule_contrat

-- 4. Get pending reminders for scheduler
-- Query: WHERE planned_at <= ? AND status = 'REMINDER_PENDING'
-- Index: idx_reminder_planned

-- 5. Audit log queries
-- Query: WHERE entity_type = ? AND entity_id = ?
-- Index: idx_audit_log_entity
```

---

## 5. Alerting & Monitoring Strategy

### 5.1 Key Metrics

```yaml
metrics:
  # Counter metrics
  counters:
    - name: retry_rejections_total
      labels: [organisation_id, societe_id, rejection_code]
      description: Total payment rejections received
      
    - name: retry_schedules_created_total
      labels: [organisation_id, eligibility]
      description: Total retry schedules created
      
    - name: retry_attempts_total
      labels: [organisation_id, status]
      description: Total retry attempts by status
      
    - name: reminders_sent_total
      labels: [organisation_id, channel, status]
      description: Total reminders sent by channel and status

  # Gauge metrics
  gauges:
    - name: retry_schedules_pending
      labels: [organisation_id]
      description: Current count of pending retry schedules
      
    - name: retry_jobs_running
      labels: [organisation_id]
      description: Current count of running retry jobs
      
    - name: reminders_pending
      labels: [organisation_id, channel]
      description: Current count of pending reminders

  # Histogram metrics
  histograms:
    - name: retry_execution_duration_seconds
      labels: [organisation_id]
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
      description: Time to execute a retry attempt
      
    - name: reminder_delivery_duration_seconds
      labels: [organisation_id, channel]
      buckets: [0.1, 0.5, 1, 2, 5, 10]
      description: Time to deliver a reminder
```

### 5.2 Alert Thresholds

```yaml
alerts:
  critical:
    - name: HighAM04Rate
      condition: |
        (sum(rate(retry_rejections_total{rejection_code="AM04"}[1h])) 
         / sum(rate(payment_attempts_total[1h]))) > 0.05
      threshold: "> 5% AM04 rate in last hour"
      action: "Immediate investigation required - potential bank/mandate issues"
      
    - name: SchedulerDown
      condition: |
        absent(retry_jobs_running) OR
        time() - max(retry_job_last_completed_timestamp) > 86400
      threshold: "No job completed in 24h"
      action: "Check scheduler health, cron configuration"
      
    - name: AllRetriesFailing
      condition: |
        (sum(rate(retry_attempts_total{status="FAILED"}[24h])) 
         / sum(rate(retry_attempts_total[24h]))) > 0.95
      threshold: "> 95% retry failure rate"
      action: "PSP integration issue or systematic mandate problems"

  high:
    - name: RetrySuccessRateLow
      condition: |
        (sum(rate(retry_attempts_total{status="SUCCEEDED"}[7d])) 
         / sum(rate(retry_attempts_total[7d]))) < 0.3
      threshold: "< 30% success rate over 7 days"
      action: "Review retry policy effectiveness"
      
    - name: ReminderDeliveryFailing
      condition: |
        (sum(rate(reminders_sent_total{status="FAILED"}[1h])) 
         / sum(rate(reminders_sent_total[1h]))) > 0.1
      threshold: "> 10% reminder delivery failures"
      action: "Check email/SMS provider status"
      
    - name: SchedulerLag
      condition: |
        max(retry_schedule_next_retry_date - time()) < -3600
      threshold: "Retries overdue by > 1 hour"
      action: "Scheduler may be overloaded or stuck"

  medium:
    - name: PendingRetriesHigh
      condition: |
        sum(retry_schedules_pending) > 1000
      threshold: "> 1000 pending retry schedules"
      action: "Review processing capacity"
      
    - name: ReminderRateLimitHits
      condition: |
        sum(rate(reminder_rate_limit_hits_total[1h])) > 100
      threshold: "> 100 rate limit hits/hour"
      action: "May need to adjust reminder policy limits"
```

### 5.3 Dashboard Panels

```yaml
dashboards:
  am04_retry_overview:
    rows:
      - title: "Rejection Overview"
        panels:
          - type: stat
            title: "AM04 Rejections (24h)"
            query: sum(increase(retry_rejections_total{rejection_code="AM04"}[24h]))
            
          - type: stat
            title: "AM04 Rate"
            query: |
              sum(rate(retry_rejections_total{rejection_code="AM04"}[24h])) 
              / sum(rate(payment_attempts_total[24h])) * 100
            unit: "%"
            
          - type: gauge
            title: "Retry Success Rate"
            query: |
              sum(rate(retry_attempts_total{status="SUCCEEDED"}[7d])) 
              / sum(rate(retry_attempts_total[7d])) * 100
            thresholds: [30, 50, 70]
            
      - title: "Retry Pipeline"
        panels:
          - type: graph
            title: "Retry Attempts Over Time"
            queries:
              - label: "Scheduled"
                query: sum(rate(retry_attempts_total{status="SCHEDULED"}[5m]))
              - label: "Succeeded"
                query: sum(rate(retry_attempts_total{status="SUCCEEDED"}[5m]))
              - label: "Failed"
                query: sum(rate(retry_attempts_total{status="FAILED"}[5m]))
                
          - type: bar
            title: "Rejections by Code"
            query: sum by (rejection_code) (increase(retry_rejections_total[24h]))
            
      - title: "Reminders"
        panels:
          - type: graph
            title: "Reminder Delivery"
            queries:
              - label: "Sent"
                query: sum(rate(reminders_sent_total{status="SENT"}[5m]))
              - label: "Delivered"
                query: sum(rate(reminders_sent_total{status="DELIVERED"}[5m]))
              - label: "Failed"
                query: sum(rate(reminders_sent_total{status="FAILED"}[5m]))
                
          - type: pie
            title: "Reminders by Channel"
            query: sum by (channel) (increase(reminders_sent_total[24h]))
            
      - title: "Recovery Metrics"
        panels:
          - type: stat
            title: "Amount Recovered (7d)"
            query: sum(retry_amount_recovered_cents{period="7d"}) / 100
            unit: "EUR"
            
          - type: stat
            title: "Amount Pending"
            query: sum(retry_amount_pending_cents) / 100
            unit: "EUR"
```

---

## 6. Test Plan

### 6.1 Unit Tests

```typescript
// test/unit/retry-policy.service.spec.ts

describe('RetryPolicyService', () => {
  describe('calculateRetryDates', () => {
    it('should calculate J+5, J+10, J+20 dates correctly', () => {
      const rejectionDate = new Date('2026-01-15T10:00:00Z');
      const policy = createPolicy({ retryDelaysDays: [5, 10, 20] });
      
      const dates = service.calculateRetryDates(rejectionDate, policy);
      
      expect(dates).toEqual([
        new Date('2026-01-20T10:00:00Z'), // J+5
        new Date('2026-01-25T10:00:00Z'), // J+10
        new Date('2026-02-04T10:00:00Z'), // J+20
      ]);
    });
    
    it('should handle weekend dates (no adjustment)', () => {
      // Policy allows weekends
      const rejectionDate = new Date('2026-01-14T10:00:00Z'); // Wednesday
      const policy = createPolicy({ retryDelaysDays: [5] });
      
      const dates = service.calculateRetryDates(rejectionDate, policy);
      
      expect(dates[0]).toEqual(new Date('2026-01-19T10:00:00Z')); // Monday
    });
    
    it('should respect max_total_days limit', () => {
      const rejectionDate = new Date('2026-01-15T10:00:00Z');
      const policy = createPolicy({ 
        retryDelaysDays: [5, 10, 20, 30, 40], // 5 attempts
        maxTotalDays: 25 // But max 25 days
      });
      
      const dates = service.calculateRetryDates(rejectionDate, policy);
      
      // Only 3 dates should be returned (J+5, J+10, J+20 are within 25 days)
      expect(dates.length).toBe(3);
    });
  });
  
  describe('determineEligibility', () => {
    it('should return ELIGIBLE for AM04 with default policy', () => {
      const result = service.determineEligibility({
        rejectionCode: 'AM04',
        policy: createDefaultPolicy(),
        currentAttempt: 0,
        maxAttempts: 3
      });
      
      expect(result.eligibility).toBe('ELIGIBLE');
    });
    
    it('should return NOT_ELIGIBLE_REASON_CODE for AC01 (invalid IBAN)', () => {
      const result = service.determineEligibility({
        rejectionCode: 'AC01',
        policy: createDefaultPolicy(),
        currentAttempt: 0,
        maxAttempts: 3
      });
      
      expect(result.eligibility).toBe('NOT_ELIGIBLE_REASON_CODE');
    });
    
    it('should return NOT_ELIGIBLE_MAX_ATTEMPTS when attempts exhausted', () => {
      const result = service.determineEligibility({
        rejectionCode: 'AM04',
        policy: createDefaultPolicy(),
        currentAttempt: 3,
        maxAttempts: 3
      });
      
      expect(result.eligibility).toBe('NOT_ELIGIBLE_MAX_ATTEMPTS');
    });
  });
});

// test/unit/idempotency.spec.ts

describe('IdempotencyKeyGenerator', () => {
  describe('retryScheduleKey', () => {
    it('should generate consistent key for same input', () => {
      const paymentId = 'pay_123';
      const rejectionDate = new Date('2026-01-15T10:30:45.123Z');
      
      const key1 = IdempotencyKeyGenerator.retryScheduleKey(paymentId, rejectionDate);
      const key2 = IdempotencyKeyGenerator.retryScheduleKey(paymentId, rejectionDate);
      
      expect(key1).toBe(key2);
      expect(key1).toBe('pay_123:2026-01-15T10:30:45.123Z');
    });
  });
  
  describe('retryAttemptKey', () => {
    it('should include schedule id and attempt number', () => {
      const key = IdempotencyKeyGenerator.retryAttemptKey('sched_456', 2);
      
      expect(key).toBe('sched_456:2');
    });
  });
});
```

### 6.2 Integration Tests

```typescript
// test/integration/retry-scheduler.integration.spec.ts

describe('RetryScheduler Integration', () => {
  let app: INestApplication;
  let retrySchedulerService: RetrySchedulerService;
  let paymentServiceMock: MockType<PaymentService>;
  
  beforeEach(async () => {
    // Setup test database, mocks, etc.
  });
  
  describe('processDueRetries', () => {
    it('should process eligible retries and create attempts', async () => {
      // Arrange
      const schedule = await createTestSchedule({
        eligibility: 'ELIGIBLE',
        nextRetryDate: subDays(new Date(), 1), // Due yesterday
        currentAttempt: 0
      });
      
      paymentServiceMock.createPayment.mockResolvedValue({
        success: true,
        paymentId: 'psp_pay_123'
      });
      
      // Act
      const result = await retrySchedulerService.processDueRetries({
        organisationId: schedule.organisationId,
        targetDate: new Date(),
        timezone: 'Europe/Paris',
        cutoffTime: '10:00:00'
      });
      
      // Assert
      expect(result.totalProcessed).toBe(1);
      expect(result.successful).toBe(1);
      
      const updatedSchedule = await retryScheduleRepo.findOne(schedule.id);
      expect(updatedSchedule.isResolved).toBe(true);
      
      const attempt = await retryAttemptRepo.findOne({
        where: { retryScheduleId: schedule.id }
      });
      expect(attempt.status).toBe('SUCCEEDED');
    });
    
    it('should be idempotent - not process same schedule twice', async () => {
      // Arrange
      const schedule = await createTestSchedule({
        eligibility: 'ELIGIBLE',
        nextRetryDate: subDays(new Date(), 1)
      });
      
      // First processing
      await retrySchedulerService.processDueRetries({
        organisationId: schedule.organisationId,
        targetDate: new Date(),
        timezone: 'Europe/Paris',
        cutoffTime: '10:00:00'
      });
      
      // Act - Second processing
      const result = await retrySchedulerService.processDueRetries({
        organisationId: schedule.organisationId,
        targetDate: new Date(),
        timezone: 'Europe/Paris',
        cutoffTime: '10:00:00'
      });
      
      // Assert - Should not process again
      expect(result.totalProcessed).toBe(0);
      
      const attempts = await retryAttemptRepo.find({
        where: { retryScheduleId: schedule.id }
      });
      expect(attempts.length).toBe(1); // Only one attempt
    });
    
    it('should skip schedule if stop condition met (payment settled)', async () => {
      // Arrange
      const schedule = await createTestSchedule({
        eligibility: 'ELIGIBLE',
        nextRetryDate: subDays(new Date(), 1)
      });
      
      // Simulate payment settled elsewhere
      await paymentScheduleRepo.update(schedule.scheduleId, {
        status: 'PAID'
      });
      
      // Act
      const result = await retrySchedulerService.processDueRetries({
        organisationId: schedule.organisationId,
        targetDate: new Date(),
        timezone: 'Europe/Paris',
        cutoffTime: '10:00:00'
      });
      
      // Assert
      expect(result.skipped).toBe(1);
      
      const updatedSchedule = await retryScheduleRepo.findOne(schedule.id);
      expect(updatedSchedule.eligibility).toBe('NOT_ELIGIBLE_PAYMENT_SETTLED');
      expect(updatedSchedule.isResolved).toBe(true);
    });
  });
  
  describe('handlePaymentRejected', () => {
    it('should create retry schedule for AM04 rejection', async () => {
      // Arrange
      const event: PaymentRejectedEvent = {
        eventId: 'evt_123',
        organisationId: 'org_123',
        societeId: 'soc_456',
        paymentId: 'pay_789',
        scheduleId: 'sched_101',
        clientId: 'cli_202',
        reasonCode: 'AM04',
        reasonMessage: 'Account closed',
        amountCents: 10000,
        currency: 'EUR',
        pspName: 'GOCARDLESS',
        rejectedAt: new Date(),
        eventTimestamp: new Date(),
        idempotencyKey: 'pay_789:2026-01-15T10:00:00Z'
      };
      
      // Act
      const result = await retrySchedulerService.handlePaymentRejected(event);
      
      // Assert
      expect(result.processed).toBe(true);
      expect(result.eligibility).toBe('ELIGIBLE');
      expect(result.retryScheduleId).toBeDefined();
      
      const schedule = await retryScheduleRepo.findOne(result.retryScheduleId);
      expect(schedule.rejectionCode).toBe('AM04_ACCOUNT_CLOSED');
      expect(schedule.nextRetryDate).toBeDefined();
    });
    
    it('should reject duplicate events (idempotency)', async () => {
      // Arrange
      const event: PaymentRejectedEvent = {
        eventId: 'evt_123',
        paymentId: 'pay_789',
        reasonCode: 'AM04',
        rejectedAt: new Date('2026-01-15T10:00:00Z'),
        idempotencyKey: 'pay_789:2026-01-15T10:00:00.000Z',
        // ... other fields
      };
      
      // First call
      await retrySchedulerService.handlePaymentRejected(event);
      
      // Act - Duplicate
      const result = await retrySchedulerService.handlePaymentRejected(event);
      
      // Assert
      expect(result.processed).toBe(false);
      expect(result.message).toContain('duplicate');
    });
  });
});
```

### 6.3 Non-Regression Tests

```typescript
// test/e2e/retry-system.e2e.spec.ts

describe('Retry System E2E', () => {
  describe('Complete Retry Cycle', () => {
    it('should handle full retry lifecycle: J+5 fail -> J+10 fail -> J+20 success', async () => {
      // Step 1: Receive rejection
      const rejectionEvent = createPaymentRejectedEvent({
        reasonCode: 'AM04',
        rejectedAt: new Date('2026-01-15T09:00:00Z')
      });
      
      await retrySchedulerService.handlePaymentRejected(rejectionEvent);
      
      // Verify schedule created
      let schedule = await getLatestSchedule();
      expect(schedule.eligibility).toBe('ELIGIBLE');
      expect(schedule.nextRetryDate.toISOString()).toBe('2026-01-20T09:00:00.000Z');
      
      // Step 2: J+5 retry fails
      mockDate('2026-01-20T10:00:00Z');
      paymentServiceMock.createPayment.mockResolvedValueOnce({
        success: false,
        errorCode: 'AM04',
        errorMessage: 'Account still closed'
      });
      
      await retrySchedulerService.processDueRetries({
        targetDate: new Date('2026-01-20'),
        timezone: 'Europe/Paris',
        cutoffTime: '10:00:00'
      });
      
      schedule = await getLatestSchedule();
      expect(schedule.currentAttempt).toBe(1);
      expect(schedule.nextRetryDate.toISOString()).toBe('2026-01-25T09:00:00.000Z');
      
      // Step 3: J+10 retry fails
      mockDate('2026-01-25T10:00:00Z');
      paymentServiceMock.createPayment.mockResolvedValueOnce({
        success: false,
        errorCode: 'AM04'
      });
      
      await retrySchedulerService.processDueRetries({
        targetDate: new Date('2026-01-25'),
        timezone: 'Europe/Paris',
        cutoffTime: '10:00:00'
      });
      
      schedule = await getLatestSchedule();
      expect(schedule.currentAttempt).toBe(2);
      expect(schedule.nextRetryDate.toISOString()).toBe('2026-02-04T09:00:00.000Z');
      
      // Step 4: J+20 retry succeeds
      mockDate('2026-02-04T10:00:00Z');
      paymentServiceMock.createPayment.mockResolvedValueOnce({
        success: true,
        paymentId: 'psp_success_123'
      });
      
      await retrySchedulerService.processDueRetries({
        targetDate: new Date('2026-02-04'),
        timezone: 'Europe/Paris',
        cutoffTime: '10:00:00'
      });
      
      // Verify final state
      schedule = await getLatestSchedule();
      expect(schedule.currentAttempt).toBe(3);
      expect(schedule.isResolved).toBe(true);
      expect(schedule.resolutionReason).toContain('SUCCEEDED');
      
      const attempts = await retryAttemptRepo.find({
        where: { retryScheduleId: schedule.id },
        order: { attemptNumber: 'ASC' }
      });
      expect(attempts.length).toBe(3);
      expect(attempts[0].status).toBe('FAILED');
      expect(attempts[1].status).toBe('FAILED');
      expect(attempts[2].status).toBe('SUCCEEDED');
    });
    
    it('should stop retry when contract is cancelled mid-cycle', async () => {
      // Setup: Create retry schedule
      const schedule = await createTestSchedule({
        eligibility: 'ELIGIBLE',
        contratId: 'ctr_123',
        nextRetryDate: addDays(new Date(), 1)
      });
      
      // Act: Cancel the contract
      await contratService.cancel('ctr_123', { reason: 'Customer request' });
      
      // Process retries
      mockDate(addDays(new Date(), 2));
      await retrySchedulerService.processDueRetries({
        targetDate: new Date(),
        timezone: 'Europe/Paris',
        cutoffTime: '10:00:00'
      });
      
      // Assert
      const updatedSchedule = await retryScheduleRepo.findOne(schedule.id);
      expect(updatedSchedule.isResolved).toBe(true);
      expect(updatedSchedule.eligibility).toBe('NOT_ELIGIBLE_CONTRACT_CANCELLED');
      
      // Verify no payment attempt was made
      expect(paymentServiceMock.createPayment).not.toHaveBeenCalled();
    });
  });
  
  describe('Reminder System', () => {
    it('should send reminder after AM04 and before retry', async () => {
      // Setup: Create schedule with reminder policy
      const schedule = await createTestScheduleWithReminders({
        nextRetryDate: addDays(new Date(), 5)
      });
      
      // Verify ON_AM04_RECEIVED reminder was created
      let reminders = await reminderRepo.find({
        where: { retryScheduleId: schedule.id }
      });
      expect(reminders.some(r => r.trigger === 'ON_AM04_RECEIVED')).toBe(true);
      
      // Process reminders
      await reminderService.processDueReminders({
        targetTime: new Date(),
        timezone: 'Europe/Paris'
      });
      
      // Verify email was sent
      expect(emailServiceMock.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          templateId: 'am04_initial_notification'
        })
      );
      
      // Check BEFORE_RETRY reminder (2 days before)
      mockDate(addDays(new Date(), 3));
      await reminderService.processDueReminders({
        targetTime: new Date(),
        timezone: 'Europe/Paris'
      });
      
      expect(emailServiceMock.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          templateId: 'retry_upcoming_reminder'
        })
      );
    });
    
    it('should respect rate limits', async () => {
      // Setup: Policy with 1 reminder per day max
      const policy = await createReminderPolicy({
        maxRemindersPerDay: 1,
        cooldownHours: 24
      });
      
      const schedule = await createTestSchedule({
        reminderPolicyId: policy.id
      });
      
      // Send first reminder
      await reminderService.planReminder({
        retryScheduleId: schedule.id,
        trigger: 'ON_AM04_RECEIVED',
        channel: 'EMAIL'
      });
      
      await reminderService.processDueReminders({ targetTime: new Date() });
      
      // Try to send second reminder same day
      const result = await reminderService.planReminder({
        retryScheduleId: schedule.id,
        trigger: 'MANUAL',
        channel: 'EMAIL'
      });
      
      // Assert: Should be rate limited
      expect(result.success).toBe(false);
      expect(result.message).toContain('rate limit');
    });
  });
});
```

---

## 7. Concrete Scenarios

### Scenario 1: Standard AM04 → Successful Retry at J+5

```gherkin
Given a payment of 100€ is rejected with code AM04 on 2026-01-15
And the default retry policy is [J+5, J+10, J+20]
When the system processes the rejection
Then a retry schedule is created with eligibility ELIGIBLE
And the first retry is scheduled for 2026-01-20

When the scheduler runs on 2026-01-20 at 10:00
And the retry payment succeeds
Then the retry attempt is marked as SUCCEEDED
And the retry schedule is marked as resolved
And a success notification is sent to the client
```

### Scenario 2: AM04 → All Retries Fail → Max Attempts Reached

```gherkin
Given a payment of 150€ is rejected with code AM04 on 2026-01-15
And max_attempts is configured as 3

When J+5 retry on 2026-01-20 fails with AM04
Then attempt #1 is marked FAILED
And next_retry_date is set to 2026-01-25
And a "payment still failing" reminder is sent

When J+10 retry on 2026-01-25 fails with AM04
Then attempt #2 is marked FAILED
And next_retry_date is set to 2026-02-04
And another reminder is sent

When J+20 retry on 2026-02-04 fails with AM04
Then attempt #3 is marked FAILED
And retry schedule eligibility is changed to NOT_ELIGIBLE_MAX_ATTEMPTS
And retry schedule is marked as resolved
And a "final failure" notification is sent
And an alert is raised for manual review
```

### Scenario 3: AM04 → Payment Settled Externally Before Retry

```gherkin
Given a payment of 200€ is rejected with code AM04 on 2026-01-15
And a retry is scheduled for J+5 (2026-01-20)

When the client pays manually via bank transfer on 2026-01-18
And the payment is marked as settled in the system

When the scheduler runs on 2026-01-20
Then the retry schedule is checked for stop conditions
And the schedule detects payment is settled
And the retry attempt is created with status SKIPPED
And the retry schedule eligibility is changed to NOT_ELIGIBLE_PAYMENT_SETTLED
And the retry schedule is marked as resolved
And no payment is attempted
```

### Scenario 4: AM04 → Contract Cancelled During Retry Cycle

```gherkin
Given a payment of 75€ is rejected with code AM04 on 2026-01-15
And J+5 retry on 2026-01-20 fails

When the client requests contract cancellation on 2026-01-22
And the contract status is changed to CANCELLED

When the scheduler runs on 2026-01-25 for J+10 retry
Then the system detects contract is cancelled
And the retry attempt is created with status SKIPPED
And the retry schedule eligibility is changed to NOT_ELIGIBLE_CONTRACT_CANCELLED
And the retry schedule is marked as resolved
And no payment is attempted
And pending reminders are cancelled
```

### Scenario 5: AM04 → Provider Down During Retry Execution

```gherkin
Given a payment of 120€ is rejected with code AM04 on 2026-01-15
And J+5 retry is scheduled for 2026-01-20

When the scheduler runs on 2026-01-20
And the payment provider (GoCardless) returns a 503 error

Then the retry attempt status is IN_PROGRESS
And after timeout, the attempt is marked FAILED
And error_code is "PROVIDER_UNAVAILABLE"
And the retry is NOT consumed (same attempt will be retried)
And an alert is raised: "Provider delivery failed"
And the scheduler will retry on next run
```

### Scenario 6: Rate Limiting on Reminders

```gherkin
Given a reminder policy with:
  | cooldown_hours | 24 |
  | max_reminders_per_day | 2 |

And a client has received 2 reminders today

When a new reminder trigger occurs (retry failed)
Then the reminder is NOT sent immediately
And the reminder is queued for tomorrow (respecting cooldown)
And a REMINDER_RATE_LIMITED log is created
```

### Scenario 7: Manual Run Now by Admin

```gherkin
Given there are 5 pending retry schedules for organisation X
And 3 are due today, 2 are due tomorrow

When an admin clicks "Run Now" for organisation X

Then a new RetryJob is created with is_manual=true
And only the 3 due retries are processed
And the job status shows:
  | total_attempts | 3 |
And the 2 future retries are not processed
```

### Scenario 8: Replan a Retry Schedule

```gherkin
Given a retry schedule with next_retry_date = 2026-01-20
And the client contacts support requesting delay

When an admin replans the retry to 2026-01-25
With reason "Customer requested delay"

Then the retry schedule next_retry_date is updated to 2026-01-25
And an audit log is created with:
  | action | REPLANNED |
  | actor_type | USER |
  | old_value | {"next_retry_date": "2026-01-20"} |
  | new_value | {"next_retry_date": "2026-01-25"} |
And pending "before retry" reminders are rescheduled
```

### Scenario 9: Duplicate Event Received

```gherkin
Given a payment rejection event for payment_id=PAY_123 at 2026-01-15T10:00:00Z
And a retry schedule already exists with idempotency_key="PAY_123:2026-01-15T10:00:00.000Z"

When the same rejection event is received again (webhook retry)

Then the system detects the duplicate via idempotency_key
And no new retry schedule is created
And the response indicates "duplicate event ignored"
And a DUPLICATE_EXECUTION_PREVENTED log is created
```

### Scenario 10: Mandate Revoked Mid-Cycle

```gherkin
Given a payment of 90€ is rejected with code AM04 on 2026-01-15
And J+5 retry is scheduled for 2026-01-20

When the client's bank revokes the SEPA mandate on 2026-01-18
And the mandate status is updated in the system

When the scheduler runs on 2026-01-20
Then the system detects mandate is revoked
And the retry attempt is created with status SKIPPED
And the retry schedule eligibility is changed to NOT_ELIGIBLE_MANDATE_REVOKED
And the retry schedule is marked as resolved
And a "mandate revoked" notification is sent to the commercial team
```

### Scenario 11: Non-Retryable Rejection Code (AC01)

```gherkin
Given a payment of 100€ is rejected with code AC01 (Incorrect IBAN)

When the system processes the rejection

Then a retry schedule is created with eligibility NOT_ELIGIBLE_REASON_CODE
And eligibility_reason is "AC01 is non-retryable: incorrect IBAN requires customer action"
And the schedule is marked as resolved immediately
And no retries are scheduled
And an alert is sent to the client to update their IBAN
```

### Scenario 12: High AM04 Rate Alert

```gherkin
Given the normal AM04 rate is 2%
And monitoring threshold is set to 5%

When 50 payments are processed in 1 hour
And 4 are rejected with AM04 (8% rate)

Then the "HighAM04Rate" alert is triggered
And the alert contains:
  | current_rate | 8% |
  | threshold | 5% |
  | affected_payments | 4 |
And the alert is sent to the operations team
```

---

## Appendix A: Error Codes Reference

| Code | Description | Recoverable | Action |
|------|-------------|-------------|--------|
| NOT_RETRYABLE_REASON | Rejection code is not retryable | No | Notify client |
| MAX_ATTEMPTS_REACHED | All retry attempts exhausted | No | Manual intervention |
| PAYMENT_NOT_ELIGIBLE | Payment doesn't qualify for retry | No | Check conditions |
| SCHEDULER_LAG_DETECTED | Retries overdue | Yes | Check scheduler health |
| REMINDER_RATE_LIMITED | Too many reminders | Yes | Wait for cooldown |
| PROVIDER_DELIVERY_FAILED | PSP/email/SMS provider error | Yes | Retry or failover |
| DUPLICATE_EXECUTION_PREVENTED | Idempotency check blocked | N/A | Normal operation |
| POLICY_NOT_FOUND | No applicable retry policy | No | Configure policy |
| SCHEDULE_NOT_FOUND | Retry schedule doesn't exist | No | Check ID |
| INVALID_STATE_TRANSITION | Attempted invalid status change | No | Bug or race condition |
| IDEMPOTENCY_CONFLICT | Same operation already in progress | Yes | Wait and retry |

---

## Appendix B: Protobuf Files Reference

```
proto/
└── retry/
    ├── am04_retry.proto           # Core types, enums, events
    └── am04_retry_service.proto   # gRPC services, requests, responses
```

Generate code with:
```bash
buf generate proto/retry
```

Output:
```
proto/gen/
├── ts/
│   └── retry/
│       ├── am04_retry.ts
│       ├── am04_retry_service.ts
│       └── index.ts
└── zod/
    └── retry/
        ├── am04_retry.ts
        └── am04_retry_service.ts
```
