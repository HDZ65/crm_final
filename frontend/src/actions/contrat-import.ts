"use server"

import { revalidatePath } from "next/cache"
import { contrats } from "@/lib/grpc"

export interface ImportContratsInput {
  organisationId: string
  dryRun?: boolean
}

export interface ImportEntityStats {
  created: number
  updated: number
  skipped: number
}

export interface ImportContratError {
  entityType?: string
  message: string
}

export interface ImportContratsData {
  total: number
  created: number
  updated: number
  skipped: number
  errors: ImportContratError[]
}

export interface ImportContratsActionResult {
  success: boolean
  data?: ImportContratsData
  error?: string
}

interface ImportAllRequest {
  organisation_id: string
  dry_run?: boolean
}

interface RawImportError {
  prospect_external_id?: string
  prospectExternalId?: string
  message?: string
}

interface RawImportAllResponse {
  total?: number
  created?: number
  updated?: number
  skipped?: number
  errors?: RawImportError[]
}

interface ContratsImportClient {
  importAll?: (request: ImportAllRequest) => Promise<RawImportAllResponse>
  ImportAll?: (request: ImportAllRequest) => Promise<RawImportAllResponse>
}

function normalizeImportResponse(response: RawImportAllResponse): ImportContratsData {
  const normalizedErrors = (response.errors || []).map((err) => ({
    message: err.message || "Erreur inconnue",
  }))

  return {
    total: response.total ?? 0,
    created: response.created ?? 0,
    updated: response.updated ?? 0,
    skipped: response.skipped ?? 0,
    errors: normalizedErrors,
  }
}

export async function importContratsFromExternal(
  input: ImportContratsInput
): Promise<ImportContratsActionResult> {
  try {
    const importClient = contrats as unknown as ContratsImportClient
    const importAll = importClient.importAll ?? importClient.ImportAll

    if (!importAll) {
      return {
        success: false,
        error: "La méthode ImportAll n'est pas disponible sur le service contrats",
      }
    }

    const response = await importAll({
      organisation_id: input.organisationId,
      dry_run: input.dryRun ?? false,
    })

    if (!input.dryRun) {
      revalidatePath("/contrats")
    }

    return {
      success: true,
      data: normalizeImportResponse(response),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de l'import des contrats",
    }
  }
}
