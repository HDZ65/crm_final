"use server";

import { holidays } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import type { HolidayZone, Holiday } from "@proto/calendar/calendar";
import type { ActionResult, PaginatedResult } from "@/lib/types/common";

function mapHolidayZone(zone: {
  id: string;
  organisationId: string;
  code: string;
  name: string;
  countryCode: string;
  regionCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}): HolidayZone {
  return {
    id: zone.id,
    organisationId: zone.organisationId,
    code: zone.code,
    name: zone.name,
    countryCode: zone.countryCode,
    regionCode: zone.regionCode,
    isActive: zone.isActive,
    createdAt: zone.createdAt,
    updatedAt: zone.updatedAt,
  };
}

function mapHoliday(holiday: {
  id: string;
  holidayZoneId: string;
  date: string;
  name: string;
  holidayType: number;
  isRecurring: boolean;
  recurringMonth: number;
  recurringDay: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}): Holiday {
  return {
    id: holiday.id,
    holidayZoneId: holiday.holidayZoneId,
    date: holiday.date,
    name: holiday.name,
    holidayType: holiday.holidayType as number,
    isRecurring: holiday.isRecurring,
    recurringMonth: holiday.recurringMonth,
    recurringDay: holiday.recurringDay,
    isActive: holiday.isActive,
    createdAt: holiday.createdAt,
    updatedAt: holiday.updatedAt,
  };
}

export async function listHolidayZones(input: {
  organisationId: string;
  countryCode?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<PaginatedResult<HolidayZone>>> {
  try {
    const response = await holidays.listZones({
      organisationId: input.organisationId,
      countryCode: input.countryCode || "",
      pagination: {
        page: input.page || 1,
        limit: input.limit || 50,
        sortBy: "name",
        sortOrder: "asc",
      },
    });
    return {
      data: {
        data: response.zones.map(mapHolidayZone),
        total: response.pagination?.total || response.zones.length,
        page: response.pagination?.page || 1,
        limit: response.pagination?.limit || 50,
        totalPages: response.pagination?.totalPages || 1,
      },
      error: null,
    };
  } catch (err) {
    console.error("[listHolidayZones] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des zones de jours fériés",
    };
  }
}

export async function getHolidayZone(
  id: string
): Promise<ActionResult<HolidayZone>> {
  try {
    const response = await holidays.getZone({ id });
    return { data: mapHolidayZone(response), error: null };
  } catch (err) {
    console.error("[getHolidayZone] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement de la zone",
    };
  }
}

export async function createHolidayZone(input: {
  organisationId: string;
  code: string;
  name: string;
  countryCode: string;
  regionCode?: string;
}): Promise<ActionResult<HolidayZone>> {
  try {
    const response = await holidays.createZone({
      organisationId: input.organisationId,
      code: input.code,
      name: input.name,
      countryCode: input.countryCode,
      regionCode: input.regionCode || "",
    });
    revalidatePath("/calendrier/jours-feries");
    return { data: mapHolidayZone(response), error: null };
  } catch (err) {
    console.error("[createHolidayZone] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la création de la zone",
    };
  }
}

export async function updateHolidayZone(input: {
  id: string;
  code: string;
  name: string;
  countryCode: string;
  regionCode?: string;
  isActive: boolean;
}): Promise<ActionResult<HolidayZone>> {
  try {
    const response = await holidays.updateZone({
      id: input.id,
      code: input.code,
      name: input.name,
      countryCode: input.countryCode,
      regionCode: input.regionCode || "",
      isActive: input.isActive,
    });
    revalidatePath("/calendrier/jours-feries");
    return { data: mapHolidayZone(response), error: null };
  } catch (err) {
    console.error("[updateHolidayZone] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise à jour de la zone",
    };
  }
}

export async function deleteHolidayZone(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    await holidays.deleteZone({ id });
    revalidatePath("/calendrier/jours-feries");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteHolidayZone] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression de la zone",
    };
  }
}

export async function listHolidays(input: {
  holidayZoneId: string;
  year?: number;
  page?: number;
  limit?: number;
}): Promise<ActionResult<PaginatedResult<Holiday>>> {
  try {
    const response = await holidays.list({
      holidayZoneId: input.holidayZoneId,
      year: input.year || new Date().getFullYear(),
      pagination: {
        page: input.page || 1,
        limit: input.limit || 50,
        sortBy: "date",
        sortOrder: "asc",
      },
    });
    return {
      data: {
        data: response.holidays.map(mapHoliday),
        total: response.pagination?.total || response.holidays.length,
        page: response.pagination?.page || 1,
        limit: response.pagination?.limit || 50,
        totalPages: response.pagination?.totalPages || 1,
      },
      error: null,
    };
  } catch (err) {
    console.error("[listHolidays] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des jours fériés",
    };
  }
}

export async function getHoliday(
  id: string
): Promise<ActionResult<Holiday>> {
  try {
    const response = await holidays.get({ id });
    return { data: mapHoliday(response), error: null };
  } catch (err) {
    console.error("[getHoliday] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement du jour férié",
    };
  }
}

export async function createHoliday(input: {
  holidayZoneId: string;
  date: string;
  name: string;
  holidayType: number;
  isRecurring: boolean;
  recurringMonth?: number;
  recurringDay?: number;
}): Promise<ActionResult<Holiday>> {
  try {
    const response = await holidays.create({
      holidayZoneId: input.holidayZoneId,
      date: input.date,
      name: input.name,
      holidayType: input.holidayType,
      isRecurring: input.isRecurring,
      recurringMonth: input.recurringMonth || 0,
      recurringDay: input.recurringDay || 0,
    });
    revalidatePath("/calendrier/jours-feries");
    return { data: mapHoliday(response), error: null };
  } catch (err) {
    console.error("[createHoliday] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la création du jour férié",
    };
  }
}

export async function updateHoliday(input: {
  id: string;
  date: string;
  name: string;
  holidayType: number;
  isRecurring: boolean;
  recurringMonth?: number;
  recurringDay?: number;
  isActive: boolean;
}): Promise<ActionResult<Holiday>> {
  try {
    const response = await holidays.update({
      id: input.id,
      date: input.date,
      name: input.name,
      holidayType: input.holidayType,
      isRecurring: input.isRecurring,
      recurringMonth: input.recurringMonth || 0,
      recurringDay: input.recurringDay || 0,
      isActive: input.isActive,
    });
    revalidatePath("/calendrier/jours-feries");
    return { data: mapHoliday(response), error: null };
  } catch (err) {
    console.error("[updateHoliday] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise à jour du jour férié",
    };
  }
}

export async function deleteHoliday(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    await holidays.delete({ id });
    revalidatePath("/calendrier/jours-feries");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteHoliday] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression du jour férié",
    };
  }
}

export async function importHolidaysByCountry(input: {
  organisationId: string;
  countryCode: string;
  year: number;
  includeRegional?: boolean;
}): Promise<
  ActionResult<{ success: boolean; importedCount: number; holidayZoneId: string }>
> {
  try {
    const response = await holidays.importByCountry({
      organisationId: input.organisationId,
      countryCode: input.countryCode,
      year: input.year,
      includeRegional: input.includeRegional || false,
    });
    revalidatePath("/calendrier/jours-feries");
    return {
      data: {
        success: response.success,
        importedCount: response.importedCount,
        holidayZoneId: response.holidayZoneId,
      },
      error: null,
    };
  } catch (err) {
    console.error("[importHolidaysByCountry] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de l'import des jours fériés",
    };
  }
}
