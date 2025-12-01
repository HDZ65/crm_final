"use client"

import { useCallback, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"
import type {
  ApporteurResponseDto,
  RepriseCommissionResponseDto,
  BordereauCommissionResponseDto,
} from "@/types/commission-dto"

// ============================================================================
// Types pour les mutations
// ============================================================================

export interface CreateApporteurDto {
  organisationId: string
  nom: string
  prenom: string
  typeApporteur: "vrp" | "manager" | "directeur" | "partenaire"
  email?: string
  telephone?: string
}

export interface UpdateApporteurDto {
  nom?: string
  prenom?: string
  typeApporteur?: "vrp" | "manager" | "directeur" | "partenaire"
  email?: string
  telephone?: string
  actif?: boolean
}

export interface AnnulerRepriseDto {
  motif: string
}

export interface ValiderBordereauDto {
  commentaire?: string
}

// ============================================================================
// Hooks pour les Apporteurs
// ============================================================================

/**
 * Hook pour créer un nouvel apporteur
 * POST /apporteurs
 */
export function useCreateApporteur() {
  const [apporteur, setApporteur] = useState<ApporteurResponseDto | null>(null)
  const { loading, error, execute } = useApi<ApporteurResponseDto>()

  const create = useCallback(
    async (data: CreateApporteurDto) => {
      try {
        const response = await execute(() => api.post("/apporteurs", data))
        if (response) {
          setApporteur(response)
        }
        return response
      } catch {
        return null
      }
    },
    [execute]
  )

  const reset = useCallback(() => {
    setApporteur(null)
  }, [])

  return {
    apporteur,
    loading,
    error,
    create,
    reset,
  }
}

/**
 * Hook pour mettre à jour un apporteur
 * PATCH /apporteurs/:id
 */
export function useUpdateApporteur() {
  const [apporteur, setApporteur] = useState<ApporteurResponseDto | null>(null)
  const { loading, error, execute } = useApi<ApporteurResponseDto>()

  const update = useCallback(
    async (apporteurId: string, data: UpdateApporteurDto) => {
      try {
        const response = await execute(() => api.patch(`/apporteurs/${apporteurId}`, data))
        if (response) {
          setApporteur(response)
        }
        return response
      } catch {
        return null
      }
    },
    [execute]
  )

  const reset = useCallback(() => {
    setApporteur(null)
  }, [])

  return {
    apporteur,
    loading,
    error,
    update,
    reset,
  }
}

/**
 * Hook pour activer/désactiver un apporteur
 * PATCH /apporteurs/:id/toggle-actif
 */
export function useToggleApporteurActif() {
  const { loading, error, execute } = useApi<ApporteurResponseDto>()

  const toggle = useCallback(
    async (apporteurId: string, actif: boolean) => {
      try {
        const response = await execute(() =>
          api.patch(`/apporteurs/${apporteurId}/toggle-actif`, { actif })
        )
        return response
      } catch {
        return null
      }
    },
    [execute]
  )

  return {
    loading,
    error,
    toggle,
  }
}

// ============================================================================
// Hooks pour les Reprises
// ============================================================================

/**
 * Hook pour annuler une reprise
 * POST /reprises-commission/:id/annuler
 */
export function useAnnulerReprise() {
  const [reprise, setReprise] = useState<RepriseCommissionResponseDto | null>(null)
  const { loading, error, execute } = useApi<RepriseCommissionResponseDto>()

  const annuler = useCallback(
    async (repriseId: string, data: AnnulerRepriseDto) => {
      try {
        const response = await execute(() =>
          api.post(`/reprises-commission/${repriseId}/annuler`, data)
        )
        if (response) {
          setReprise(response)
        }
        return response
      } catch {
        return null
      }
    },
    [execute]
  )

  const reset = useCallback(() => {
    setReprise(null)
  }, [])

  return {
    reprise,
    loading,
    error,
    annuler,
    reset,
  }
}

// ============================================================================
// Hooks pour les Bordereaux
// ============================================================================

/**
 * Hook pour valider un bordereau
 * POST /bordereaux-commission/:id/valider
 */
export function useValiderBordereau() {
  const [bordereau, setBordereau] = useState<BordereauCommissionResponseDto | null>(null)
  const { loading, error, execute } = useApi<BordereauCommissionResponseDto>()

  const valider = useCallback(
    async (bordereauId: string, data?: ValiderBordereauDto) => {
      try {
        const response = await execute(() =>
          api.post(`/bordereaux-commission/${bordereauId}/valider`, data || {})
        )
        if (response) {
          setBordereau(response)
        }
        return response
      } catch {
        return null
      }
    },
    [execute]
  )

  const reset = useCallback(() => {
    setBordereau(null)
  }, [])

  return {
    bordereau,
    loading,
    error,
    valider,
    reset,
  }
}

/**
 * Hook pour exporter un bordereau en PDF
 * GET /bordereaux-commission/:id/export/pdf
 */
export function useExportBordereauPDF() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const exportPDF = useCallback(async (bordereauId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.getBlob(`/bordereaux-commission/${bordereauId}/export/pdf`)
      if (response) {
        // Créer un lien pour télécharger le fichier
        const url = window.URL.createObjectURL(response)
        const link = document.createElement("a")
        link.href = url
        link.download = `bordereau-${bordereauId}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        return true
      }
      return false
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors de l'export PDF"))
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    exportPDF,
  }
}

/**
 * Hook pour exporter un bordereau en Excel
 * GET /bordereaux-commission/:id/export/excel
 */
export function useExportBordereauExcel() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const exportExcel = useCallback(async (bordereauId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.getBlob(`/bordereaux-commission/${bordereauId}/export/excel`)
      if (response) {
        // Créer un lien pour télécharger le fichier
        const url = window.URL.createObjectURL(response)
        const link = document.createElement("a")
        link.href = url
        link.download = `bordereau-${bordereauId}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        return true
      }
      return false
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erreur lors de l'export Excel"))
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    exportExcel,
  }
}

// ============================================================================
// Hooks pour les Commissions
// ============================================================================

/**
 * Hook pour désélectionner une commission avec motif
 * POST /commissions/:id/deselectionner
 */
export function useDeselectionnerCommission() {
  const { loading, error, execute } = useApi<void>()

  const deselectionner = useCallback(
    async (commissionId: string, motif: string) => {
      try {
        await execute(() =>
          api.post(`/commissions/${commissionId}/deselectionner`, { motif })
        )
        return true
      } catch {
        return false
      }
    },
    [execute]
  )

  return {
    loading,
    error,
    deselectionner,
  }
}

/**
 * Hook combiné pour toutes les mutations de commission
 */
export function useCommissionMutations() {
  const createApporteur = useCreateApporteur()
  const updateApporteur = useUpdateApporteur()
  const toggleApporteurActif = useToggleApporteurActif()
  const annulerReprise = useAnnulerReprise()
  const validerBordereau = useValiderBordereau()
  const exportBordereauPDF = useExportBordereauPDF()
  const exportBordereauExcel = useExportBordereauExcel()
  const deselectionnerCommission = useDeselectionnerCommission()

  return {
    createApporteur,
    updateApporteur,
    toggleApporteurActif,
    annulerReprise,
    validerBordereau,
    exportBordereauPDF,
    exportBordereauExcel,
    deselectionnerCommission,
  }
}
