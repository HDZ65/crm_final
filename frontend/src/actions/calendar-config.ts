"use server";

import { debitConfig } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import type {
  SystemDebitConfiguration,
  CompanyDebitConfiguration,
  ClientDebitConfiguration,
  ContractDebitConfiguration,
  ResolvedDebitConfiguration,
} from "@proto/calendar/calendar";
import type { ActionResult, PaginatedResult } from "@/lib/types/common";

function mapSystemConfig(config: {
  id: string;
  organisationId: string;
  defaultMode: number;
  defaultBatch: number;
  defaultFixedDay: number;
  shiftStrategy: number;
  holidayZoneId: string;
  cutoffConfigId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}): SystemDebitConfiguration {
  return {
    id: config.id,
    organisationId: config.organisationId,
    defaultMode: config.defaultMode,
    defaultBatch: config.defaultBatch,
    defaultFixedDay: config.defaultFixedDay,
    shiftStrategy: config.shiftStrategy,
    holidayZoneId: config.holidayZoneId,
    cutoffConfigId: config.cutoffConfigId,
    isActive: config.isActive,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}

function mapCompanyConfig(config: {
  id: string;
  organisationId: string;
  societeId: string;
  mode: number;
  batch: number;
  fixedDay: number;
  shiftStrategy: number;
  holidayZoneId: string;
  cutoffConfigId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}): CompanyDebitConfiguration {
  return {
    id: config.id,
    organisationId: config.organisationId,
    societeId: config.societeId,
    mode: config.mode,
    batch: config.batch,
    fixedDay: config.fixedDay,
    shiftStrategy: config.shiftStrategy,
    holidayZoneId: config.holidayZoneId,
    cutoffConfigId: config.cutoffConfigId,
    isActive: config.isActive,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}

function mapClientConfig(config: {
  id: string;
  organisationId: string;
  clientId: string;
  mode: number;
  batch: number;
  fixedDay: number;
  shiftStrategy: number;
  holidayZoneId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}): ClientDebitConfiguration {
  return {
    id: config.id,
    organisationId: config.organisationId,
    clientId: config.clientId,
    mode: config.mode,
    batch: config.batch,
    fixedDay: config.fixedDay,
    shiftStrategy: config.shiftStrategy,
    holidayZoneId: config.holidayZoneId,
    isActive: config.isActive,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}

function mapContractConfig(config: {
  id: string;
  organisationId: string;
  contratId: string;
  mode: number;
  batch: number;
  fixedDay: number;
  shiftStrategy: number;
  holidayZoneId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}): ContractDebitConfiguration {
  return {
    id: config.id,
    organisationId: config.organisationId,
    contratId: config.contratId,
    mode: config.mode,
    batch: config.batch,
    fixedDay: config.fixedDay,
    shiftStrategy: config.shiftStrategy,
    holidayZoneId: config.holidayZoneId,
    isActive: config.isActive,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}

export async function getSystemConfig(
  organisationId: string
): Promise<ActionResult<SystemDebitConfiguration>> {
  try {
    const response = await debitConfig.getSystemConfig({ organisationId });
    return { data: mapSystemConfig(response), error: null };
  } catch (err) {
    console.error("[getSystemConfig] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement de la configuration système",
    };
  }
}

export async function updateSystemConfig(input: {
  organisationId: string;
  defaultMode: number;
  defaultBatch: number;
  defaultFixedDay: number;
  shiftStrategy: number;
  holidayZoneId: string;
  cutoffConfigId: string;
}): Promise<ActionResult<SystemDebitConfiguration>> {
  try {
    const response = await debitConfig.updateSystemConfig({
      organisationId: input.organisationId,
      defaultMode: input.defaultMode,
      defaultBatch: input.defaultBatch,
      defaultFixedDay: input.defaultFixedDay,
      shiftStrategy: input.shiftStrategy,
      holidayZoneId: input.holidayZoneId,
      cutoffConfigId: input.cutoffConfigId,
    });
    revalidatePath("/calendrier/configurations");
    return { data: mapSystemConfig(response), error: null };
  } catch (err) {
    console.error("[updateSystemConfig] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise à jour de la configuration système",
    };
  }
}

export async function listCompanyConfigs(input: {
  organisationId: string;
  societeId?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<PaginatedResult<CompanyDebitConfiguration>>> {
  try {
    const response = await debitConfig.listCompanyConfigs({
      organisationId: input.organisationId,
      societeId: input.societeId || "",
      pagination: {
        page: input.page || 1,
        limit: input.limit || 20,
        sortBy: "createdAt",
        sortOrder: "desc",
      },
    });
    return {
      data: {
        data: response.configs.map(mapCompanyConfig),
        total: response.pagination?.total || response.configs.length,
        page: response.pagination?.page || 1,
        limit: response.pagination?.limit || 20,
        totalPages: response.pagination?.totalPages || 1,
      },
      error: null,
    };
  } catch (err) {
    console.error("[listCompanyConfigs] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des configurations société",
    };
  }
}

export async function getCompanyConfig(
  id: string
): Promise<ActionResult<CompanyDebitConfiguration>> {
  try {
    const response = await debitConfig.getCompanyConfig({ id });
    return { data: mapCompanyConfig(response), error: null };
  } catch (err) {
    console.error("[getCompanyConfig] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement de la configuration société",
    };
  }
}

export async function createCompanyConfig(input: {
  organisationId: string;
  societeId: string;
  mode: number;
  batch: number;
  fixedDay: number;
  shiftStrategy: number;
  holidayZoneId: string;
  cutoffConfigId: string;
}): Promise<ActionResult<CompanyDebitConfiguration>> {
  try {
    const response = await debitConfig.createCompanyConfig({
      organisationId: input.organisationId,
      societeId: input.societeId,
      mode: input.mode,
      batch: input.batch,
      fixedDay: input.fixedDay,
      shiftStrategy: input.shiftStrategy,
      holidayZoneId: input.holidayZoneId,
      cutoffConfigId: input.cutoffConfigId,
    });
    revalidatePath("/calendrier/configurations");
    return { data: mapCompanyConfig(response), error: null };
  } catch (err) {
    console.error("[createCompanyConfig] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la création de la configuration société",
    };
  }
}

export async function updateCompanyConfig(input: {
  id: string;
  mode: number;
  batch: number;
  fixedDay: number;
  shiftStrategy: number;
  holidayZoneId: string;
  cutoffConfigId: string;
  isActive: boolean;
}): Promise<ActionResult<CompanyDebitConfiguration>> {
  try {
    const response = await debitConfig.updateCompanyConfig({
      id: input.id,
      mode: input.mode,
      batch: input.batch,
      fixedDay: input.fixedDay,
      shiftStrategy: input.shiftStrategy,
      holidayZoneId: input.holidayZoneId,
      cutoffConfigId: input.cutoffConfigId,
      isActive: input.isActive,
    });
    revalidatePath("/calendrier/configurations");
    return { data: mapCompanyConfig(response), error: null };
  } catch (err) {
    console.error("[updateCompanyConfig] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise à jour de la configuration société",
    };
  }
}

export async function deleteCompanyConfig(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    await debitConfig.deleteCompanyConfig({ id });
    revalidatePath("/calendrier/configurations");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteCompanyConfig] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression de la configuration société",
    };
  }
}

export async function listClientConfigs(input: {
  organisationId: string;
  clientId?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<PaginatedResult<ClientDebitConfiguration>>> {
  try {
    const response = await debitConfig.listClientConfigs({
      organisationId: input.organisationId,
      clientId: input.clientId || "",
      pagination: {
        page: input.page || 1,
        limit: input.limit || 20,
        sortBy: "createdAt",
        sortOrder: "desc",
      },
    });
    return {
      data: {
        data: response.configs.map(mapClientConfig),
        total: response.pagination?.total || response.configs.length,
        page: response.pagination?.page || 1,
        limit: response.pagination?.limit || 20,
        totalPages: response.pagination?.totalPages || 1,
      },
      error: null,
    };
  } catch (err) {
    console.error("[listClientConfigs] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des configurations client",
    };
  }
}

export async function getClientConfig(
  id: string
): Promise<ActionResult<ClientDebitConfiguration>> {
  try {
    const response = await debitConfig.getClientConfig({ id });
    return { data: mapClientConfig(response), error: null };
  } catch (err) {
    console.error("[getClientConfig] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement de la configuration client",
    };
  }
}

export async function createClientConfig(input: {
  organisationId: string;
  clientId: string;
  mode: number;
  batch: number;
  fixedDay: number;
  shiftStrategy: number;
  holidayZoneId: string;
}): Promise<ActionResult<ClientDebitConfiguration>> {
  try {
    const response = await debitConfig.createClientConfig({
      organisationId: input.organisationId,
      clientId: input.clientId,
      mode: input.mode,
      batch: input.batch,
      fixedDay: input.fixedDay,
      shiftStrategy: input.shiftStrategy,
      holidayZoneId: input.holidayZoneId,
    });
    revalidatePath("/calendrier/configurations");
    return { data: mapClientConfig(response), error: null };
  } catch (err) {
    console.error("[createClientConfig] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la création de la configuration client",
    };
  }
}

export async function updateClientConfig(input: {
  id: string;
  mode: number;
  batch: number;
  fixedDay: number;
  shiftStrategy: number;
  holidayZoneId: string;
  isActive: boolean;
}): Promise<ActionResult<ClientDebitConfiguration>> {
  try {
    const response = await debitConfig.updateClientConfig({
      id: input.id,
      mode: input.mode,
      batch: input.batch,
      fixedDay: input.fixedDay,
      shiftStrategy: input.shiftStrategy,
      holidayZoneId: input.holidayZoneId,
      isActive: input.isActive,
    });
    revalidatePath("/calendrier/configurations");
    return { data: mapClientConfig(response), error: null };
  } catch (err) {
    console.error("[updateClientConfig] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise à jour de la configuration client",
    };
  }
}

export async function deleteClientConfig(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    await debitConfig.deleteClientConfig({ id });
    revalidatePath("/calendrier/configurations");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteClientConfig] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression de la configuration client",
    };
  }
}

export async function listContractConfigs(input: {
  organisationId: string;
  contratId?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<PaginatedResult<ContractDebitConfiguration>>> {
  try {
    const response = await debitConfig.listContractConfigs({
      organisationId: input.organisationId,
      contratId: input.contratId || "",
      pagination: {
        page: input.page || 1,
        limit: input.limit || 20,
        sortBy: "createdAt",
        sortOrder: "desc",
      },
    });
    return {
      data: {
        data: response.configs.map(mapContractConfig),
        total: response.pagination?.total || response.configs.length,
        page: response.pagination?.page || 1,
        limit: response.pagination?.limit || 20,
        totalPages: response.pagination?.totalPages || 1,
      },
      error: null,
    };
  } catch (err) {
    console.error("[listContractConfigs] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des configurations contrat",
    };
  }
}

export async function getContractConfig(
  id: string
): Promise<ActionResult<ContractDebitConfiguration>> {
  try {
    const response = await debitConfig.getContractConfig({ id });
    return { data: mapContractConfig(response), error: null };
  } catch (err) {
    console.error("[getContractConfig] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement de la configuration contrat",
    };
  }
}

export async function createContractConfig(input: {
  organisationId: string;
  contratId: string;
  mode: number;
  batch: number;
  fixedDay: number;
  shiftStrategy: number;
  holidayZoneId: string;
}): Promise<ActionResult<ContractDebitConfiguration>> {
  try {
    const response = await debitConfig.createContractConfig({
      organisationId: input.organisationId,
      contratId: input.contratId,
      mode: input.mode,
      batch: input.batch,
      fixedDay: input.fixedDay,
      shiftStrategy: input.shiftStrategy,
      holidayZoneId: input.holidayZoneId,
    });
    revalidatePath("/calendrier/configurations");
    return { data: mapContractConfig(response), error: null };
  } catch (err) {
    console.error("[createContractConfig] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la création de la configuration contrat",
    };
  }
}

export async function updateContractConfig(input: {
  id: string;
  mode: number;
  batch: number;
  fixedDay: number;
  shiftStrategy: number;
  holidayZoneId: string;
  isActive: boolean;
}): Promise<ActionResult<ContractDebitConfiguration>> {
  try {
    const response = await debitConfig.updateContractConfig({
      id: input.id,
      mode: input.mode,
      batch: input.batch,
      fixedDay: input.fixedDay,
      shiftStrategy: input.shiftStrategy,
      holidayZoneId: input.holidayZoneId,
      isActive: input.isActive,
    });
    revalidatePath("/calendrier/configurations");
    return { data: mapContractConfig(response), error: null };
  } catch (err) {
    console.error("[updateContractConfig] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise à jour de la configuration contrat",
    };
  }
}

export async function deleteContractConfig(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    await debitConfig.deleteContractConfig({ id });
    revalidatePath("/calendrier/configurations");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteContractConfig] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression de la configuration contrat",
    };
  }
}

export async function resolveConfiguration(input: {
  organisationId: string;
  contratId?: string;
  clientId?: string;
  societeId?: string;
}): Promise<ActionResult<ResolvedDebitConfiguration>> {
  try {
    const response = await debitConfig.resolveConfiguration({
      organisationId: input.organisationId,
      contratId: input.contratId || "",
      clientId: input.clientId || "",
      societeId: input.societeId || "",
    });
    return {
      data: {
        appliedLevel: response.appliedLevel as number,
        appliedConfigId: response.appliedConfigId,
        mode: response.mode as number,
        batch: response.batch as number,
        fixedDay: response.fixedDay,
        shiftStrategy: response.shiftStrategy as number,
        holidayZoneId: response.holidayZoneId,
        cutoffConfigId: response.cutoffConfigId,
      },
      error: null,
    };
  } catch (err) {
    console.error("[resolveConfiguration] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la résolution de la configuration",
    };
  }
}
