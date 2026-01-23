import { getActiveOrgId } from "@/lib/server-data";
import { getCalendarView } from "@/actions/calendar-admin";
import { listHolidayZones } from "@/actions/calendar-holidays";
import { getSystemConfig } from "@/actions/calendar-config";
import { CalendrierPageClient } from "./calendrier-page-client";

export default async function CalendrierPage() {
  const activeOrgId = await getActiveOrgId();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [calendarResult, zonesResult, systemConfigResult] = await Promise.all([
    activeOrgId
      ? getCalendarView({
          organisationId: activeOrgId,
          startDate: startOfMonth.toISOString().split("T")[0],
          endDate: endOfMonth.toISOString().split("T")[0],
          includeVolumes: true,
        })
      : Promise.resolve({ data: null, error: null }),
    activeOrgId
      ? listHolidayZones({ organisationId: activeOrgId })
      : Promise.resolve({ data: null, error: null }),
    activeOrgId
      ? getSystemConfig(activeOrgId)
      : Promise.resolve({ data: null, error: null }),
  ]);

  return (
    <CalendrierPageClient
      initialCalendar={calendarResult.data}
      initialZones={zonesResult.data?.data}
      initialSystemConfig={systemConfigResult.data}
      organisationId={activeOrgId || ""}
    />
  );
}
