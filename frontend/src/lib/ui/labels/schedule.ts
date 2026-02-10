/**
 * UI labels for schedule module.
 * Proto types (ScheduleStatus, ScheduleResponse, CreateScheduleRequest)
 * come from @proto/payments/payment.
 */

import { ScheduleStatus } from "@proto/payments/payment"

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  [ScheduleStatus.SCHEDULE_STATUS_UNSPECIFIED]: "Non spécifié",
  [ScheduleStatus.SCHEDULE_STATUS_ACTIVE]: "Actif",
  [ScheduleStatus.SCHEDULE_STATUS_PAUSED]: "En pause",
  [ScheduleStatus.SCHEDULE_STATUS_CANCELLED]: "Annulé",
  [ScheduleStatus.SCHEDULE_STATUS_COMPLETED]: "Terminé",
  [ScheduleStatus.UNRECOGNIZED]: "Non reconnu",
}
