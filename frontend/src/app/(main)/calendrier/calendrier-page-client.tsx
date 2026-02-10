"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  CalendarDay,
  HolidayZone,
  SystemDebitConfiguration,
} from "@proto/calendar/calendar";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { CalendarHeatmap } from "@/components/calendar/calendar-heatmap";
import { ConfigurationPanel } from "@/components/calendar/configuration-panel";
import { HolidaysManager } from "@/components/calendar/holidays-manager";
import { AuditLogsTable } from "@/components/calendar/audit-logs-table";

interface CalendrierPageClientProps {
  initialCalendar: { days: CalendarDay[] } | null;
  initialZones: HolidayZone[] | undefined | null;
  initialSystemConfig: SystemDebitConfiguration | null;
  organisationId: string;
}

export function CalendrierPageClient({
  initialCalendar,
  initialZones,
  initialSystemConfig,
  organisationId,
}: CalendrierPageClientProps) {
  const [activeTab, setActiveTab] = useState("calendrier");

  return (
    <main className="flex flex-1 flex-col gap-4 min-h-0">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        <TabsList className="w-fit">
          <TabsTrigger value="calendrier">Calendrier</TabsTrigger>
          <TabsTrigger value="heatmap">Volumes</TabsTrigger>
          <TabsTrigger value="configurations">Configurations</TabsTrigger>
          <TabsTrigger value="jours-feries">Jours fériés</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="calendrier" className="mt-4 flex-1 min-h-0">
          <CalendarGrid
            initialDays={initialCalendar?.days || []}
            organisationId={organisationId}
          />
        </TabsContent>

        <TabsContent value="heatmap" className="mt-4 flex-1 min-h-0">
          <CalendarHeatmap organisationId={organisationId} />
        </TabsContent>

        <TabsContent value="configurations" className="mt-4 flex-1 min-h-0">
          <ConfigurationPanel
            initialSystemConfig={initialSystemConfig}
            initialZones={initialZones || []}
            organisationId={organisationId}
          />
        </TabsContent>

        <TabsContent value="jours-feries" className="mt-4 flex-1 min-h-0">
          <HolidaysManager
            initialZones={initialZones || []}
            organisationId={organisationId}
          />
        </TabsContent>

        <TabsContent value="audit" className="mt-4 flex-1 min-h-0">
          <AuditLogsTable organisationId={organisationId} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
