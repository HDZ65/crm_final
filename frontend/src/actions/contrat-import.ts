"use server"

import { revalidatePath } from "next/cache"
import { contrats } from "@/lib/grpc"

export interface ImportContratsInput {
  organisationId: string
  sourceUrl: string
  apiKey: string
  dryRun: boolean
}

export interface ImportContratError {
  row: number
  message: string
}

export interface ImportContratsData {
  totalRows: number
  created: number
  updated: number
  skipped: number
  errorsCount: number
  errors: ImportContratError[]
}

export interface ImportContratsActionResult {
  success: boolean
  data?: ImportContratsData
  error?: string
}

interface ImportFromExternalRequest {
  organisation_id: string
  source_url: string
  api_key: string
  dry_run: boolean
}

interface RawImportError {
  row?: number
  line?: number
  message?: string
  error?: string
}

interface RawImportFromExternalResponse {
  totalRows?: number
  total_rows?: number
  created?: number
  updated?: number
  skipped?: number
  errorsCount?: number
  errors_count?: number
  errors?: RawImportError[]
}

interface ContratsImportClient {
  importFromExternal?: (request: ImportFromExternalRequest) => Promise<RawImportFromExternalResponse>
  ImportFromExternal?: (request: ImportFromExternalRequest) => Promise<RawImportFromExternalResponse>
}

function normalizeImportResponse(response: RawImportFromExternalResponse): ImportContratsData {
  const normalizedErrors = (response.errors || []).map((err) => ({
    row: err.row ?? err.line ?? 0,
    message: err.message || err.error || "Erreur inconnue",
  }))

  return {
    totalRows: response.totalRows ?? response.total_rows ?? 0,
    created: response.created ?? 0,
    updated: response.updated ?? 0,
    skipped: response.skipped ?? 0,
    errorsCount: response.errorsCount ?? response.errors_count ?? normalizedErrors.length,
    errors: normalizedErrors,
  }
}

export async function importContratsFromExternal(
  input: ImportContratsInput
): Promise<ImportContratsActionResult> {
  try {
    const importClient = contrats as unknown as ContratsImportClient
    const importFromExternal = importClient.importFromExternal ?? importClient.ImportFromExternal

    if (!importFromExternal) {
      return {
        success: false,
        error: "La méthode ImportFromExternal n'est pas disponible sur le service contrats",
      }
    }

    const response = await importFromExternal({
      organisation_id: input.organisationId,
      source_url: input.sourceUrl,
      api_key: input.apiKey,
      dry_run: input.dryRun,
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
