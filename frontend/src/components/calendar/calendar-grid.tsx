"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { CalendarDayDto, PlannedDebitSummaryDto } from "@/types/calendar";
import {
  DebitBatchShortLabels,
  PlannedDateStatusLabels,
  DebitBatch,
} from "@/types/calendar";
import { getCalendarView, getDateDetails } from "@/actions/calendar-admin";
import { cn } from "@/lib/utils";

interface CalendarGridProps {
  initialDays: CalendarDayDto[];
  organisationId: string;
}

const DAYS_OF_WEEK = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const EVENT_COLORS = [
  "bg-amber-100 text-amber-900",
  "bg-blue-100 text-blue-900",
  "bg-green-100 text-green-900",
  "bg-yellow-100 text-yellow-900",
  "bg-rose-100 text-rose-900",
  "bg-purple-100 text-purple-900",
  "bg-cyan-100 text-cyan-900",
];

function formatCurrency(amountCents: number, currency: string = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(amountCents / 100);
}

function getEventColor(index: number): string {
  return EVENT_COLORS[index % EVENT_COLORS.length];
}

export function CalendarGrid({ initialDays, organisationId }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [days, setDays] = useState<CalendarDayDto[]>(initialDays);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<CalendarDayDto | null>(null);
  const [dayDetails, setDayDetails] = useState<PlannedDebitSummaryDto[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [viewMode, setViewMode] = useState<string>("month");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  const loadMonth = useCallback(
    async (newDate: Date) => {
      setLoading(true);
      const startOfMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      const endOfMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0);

      const result = await getCalendarView({
        organisationId,
        startDate: startOfMonth.toISOString().split("T")[0],
        endDate: endOfMonth.toISOString().split("T")[0],
        includeVolumes: true,
      });

      if (result.data) {
        setDays(result.data.days);
      }
      setLoading(false);
    },
    [organisationId]
  );

  const goToPreviousMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    setCurrentDate(newDate);
    loadMonth(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    setCurrentDate(newDate);
    loadMonth(newDate);
  };

  const goToToday = () => {
    const todayDate = new Date();
    setCurrentDate(todayDate);
    loadMonth(todayDate);
  };

  const openDayDetails = async (day: CalendarDayDto) => {
    setSelectedDay(day);
    setLoadingDetails(true);

    const result = await getDateDetails({
      organisationId,
      date: day.date,
      limit: 50,
    });

    if (result.data) {
      setDayDetails(result.data.debits);
    }
    setLoadingDetails(false);
  };

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDayIndex = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  interface CalendarCell {
    date: string;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    data: CalendarDayDto | null;
  }

  const calendarCells: CalendarCell[] = [];

  for (let i = startDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    calendarCells.push({
      date: dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: false,
      data: null,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayData = days.find((day) => day.date === dateStr) || null;
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    calendarCells.push({
      date: dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isToday,
      data: dayData,
    });
  }

  const remainingCells = 42 - calendarCells.length;
  for (let d = 1; d <= remainingCells; d++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarCells.push({
      date: dateStr,
      dayNumber: d,
      isCurrentMonth: false,
      isToday: false,
      data: null,
    });
  }

  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    weeks.push(calendarCells.slice(i, i + 7));
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between py-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Aujourd&apos;hui
          </Button>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold ml-2">
            {MONTH_NAMES[month]} {year}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mois</SelectItem>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="day">Jour</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Nouvel événement
          </Button>
        </div>
      </div>

      {loading ? null : (
        <div className="flex-1 flex flex-col border-l">
          <div className="grid grid-cols-7 border-b">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-sm font-medium text-muted-foreground border-r"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="flex-1 grid grid-rows-6">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0">
                {week.map((cell, dayIndex) => (
                  <button
                    key={cell.date}
                    className={cn(
                      "min-h-[120px] p-1 text-left border-r last:border-r-0 transition-colors hover:bg-muted/50 relative",
                      !cell.isCurrentMonth && "bg-muted/20"
                    )}
                    onClick={() => cell.data && openDayDetails(cell.data)}
                  >
                    <div className="flex justify-start p-1">
                      <span
                        className={cn(
                          "text-sm w-7 h-7 flex items-center justify-center rounded-full",
                          !cell.isCurrentMonth && "text-muted-foreground",
                          cell.isToday && "bg-primary text-primary-foreground font-semibold"
                        )}
                      >
                        {cell.dayNumber}
                      </span>
                    </div>
                    {cell.data && cell.data.debits.length > 0 && (
                      <div className="space-y-1 px-1">
                        {cell.data.debits.slice(0, 3).map((debit, i) => (
                          <div
                            key={i}
                            className={cn(
                              "text-xs px-2 py-0.5 rounded truncate",
                              getEventColor(i)
                            )}
                          >
                            {DebitBatchShortLabels[debit.batch as DebitBatch]} - {formatCurrency(debit.amountCents)}
                          </div>
                        ))}
                        {cell.data.debits.length > 3 && (
                          <div className="text-xs text-muted-foreground px-2">
                            + {cell.data.debits.length - 3} autres
                          </div>
                        )}
                      </div>
                    )}
                    {cell.data?.isHoliday && (
                      <div className="absolute bottom-1 left-1">
                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                          Férié
                        </Badge>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Prélèvements du{" "}
              {selectedDay &&
                new Date(selectedDay.date).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDay?.isHoliday && (
              <div className="rounded-md bg-amber-50 p-3 text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
                Jour férié : {selectedDay.holidayName}
              </div>
            )}
            {loadingDetails ? null : dayDetails.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Aucun prélèvement planifié pour cette date
              </p>
            ) : (
              <div className="space-y-2">
                {dayDetails.map((debit) => (
                  <div
                    key={debit.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">{debit.clientName}</p>
                      <p className="text-sm text-muted-foreground">
                        Contrat: {debit.contratId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(debit.amountCents, debit.currency)}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {DebitBatchShortLabels[debit.batch as DebitBatch]}
                        </Badge>
                        <Badge variant="secondary">
                          {PlannedDateStatusLabels[debit.status]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
