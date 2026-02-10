import { getActiveOrgId } from "@/lib/server/data";
// TODO: backend calendar service not implemented yet
// import { getCalendarView } from "@/actions/calendar-admin";
// import { listHolidayZones } from "@/actions/calendar-holidays";
// import { getSystemConfig } from "@/actions/calendar-config";
import { CalendrierPageClient } from "./calendrier-page-client";

export default async function CalendrierPage() {
  const activeOrgId = await getActiveOrgId();

  return (
    <CalendrierPageClient
      initialCalendar={null}
      initialZones={undefined}
      initialSystemConfig={null}
      organisationId={activeOrgId || ""}
    />
  );
}
