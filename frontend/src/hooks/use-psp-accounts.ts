"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

// Types
export interface PspAccount {
  id: string
  societeId: string
  nom: string
  environment: string
  actif: boolean
  createdAt: string
  updatedAt: string
  // Champs masqués retournés par l'API
  [key: string]: unknown
}

export interface CreatePspAccountData {
  societeId: string
  nom: string
  environment: string
  actif?: boolean
  [key: string]: string | boolean | undefined // Champs dynamiques selon le PSP
}

export type PspType = "stripe" | "gocardless" | "emerchantpay" | "slimpay" | "multisafepay" | "paypal"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

// Helper pour les appels API
async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Erreur HTTP ${response.status}`)
  }

  // Pour les DELETE qui retournent 204 No Content
  if (response.status === 204) {
    return null as T
  }

  return response.json()
}

export function usePspAccounts(societeId: string | null) {
  const [accounts, setAccounts] = useState<Record<PspType, PspAccount | null>>({
    stripe: null,
    gocardless: null,
    emerchantpay: null,
    slimpay: null,
    multisafepay: null,
    paypal: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [loadingPsp, setLoadingPsp] = useState<PspType | null>(null)

  // Charger tous les comptes PSP pour la société en un seul appel
  const loadAccounts = useCallback(async () => {
    if (!societeId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      // Un seul appel API au lieu de 5
      const allAccounts = await apiCall<Record<PspType, PspAccount | null>>(
        `/psp-accounts/societe/${societeId}`
      )
      setAccounts(allAccounts)
    } catch {
      // En cas d'erreur, initialiser avec des valeurs nulles
      setAccounts({
        stripe: null,
        gocardless: null,
        emerchantpay: null,
        slimpay: null,
        multisafepay: null,
        paypal: null,
      })
    } finally {
      setIsLoading(false)
    }
  }, [societeId])

  // Charger les comptes au montage
  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  // Connecter un compte PSP
  const connectAccount = useCallback(
    async (psp: PspType, data: Omit<CreatePspAccountData, "societeId">) => {
      if (!societeId) {
        toast.error("Aucune société sélectionnée")
        return null
      }

      setLoadingPsp(psp)
      try {
        const account = await apiCall<PspAccount>(`/${psp}-accounts`, {
          method: "POST",
          body: JSON.stringify({ ...data, societeId }),
        })

        setAccounts((prev) => ({ ...prev, [psp]: account }))
        toast.success(`Compte ${psp} connecté avec succès`)
        return account
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur inconnue"
        toast.error(`Erreur lors de la connexion: ${message}`)
        return null
      } finally {
        setLoadingPsp(null)
      }
    },
    [societeId]
  )

  // Mettre à jour un compte PSP
  const updateAccount = useCallback(
    async (psp: PspType, accountId: string, data: Partial<CreatePspAccountData>) => {
      setLoadingPsp(psp)
      try {
        const account = await apiCall<PspAccount>(`/${psp}-accounts/${accountId}`, {
          method: "PUT",
          body: JSON.stringify(data),
        })

        setAccounts((prev) => ({ ...prev, [psp]: account }))
        toast.success(`Compte ${psp} mis à jour`)
        return account
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur inconnue"
        toast.error(`Erreur lors de la mise à jour: ${message}`)
        return null
      } finally {
        setLoadingPsp(null)
      }
    },
    []
  )

  // Déconnecter un compte PSP
  const disconnectAccount = useCallback(async (psp: PspType) => {
    const account = accounts[psp]
    if (!account) {
      toast.error("Aucun compte à déconnecter")
      return false
    }

    setLoadingPsp(psp)
    try {
      await apiCall(`/${psp}-accounts/${account.id}`, {
        method: "DELETE",
      })

      setAccounts((prev) => ({ ...prev, [psp]: null }))
      toast.success(`Compte ${psp} déconnecté`)
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue"
      toast.error(`Erreur lors de la déconnexion: ${message}`)
      return false
    } finally {
      setLoadingPsp(null)
    }
  }, [accounts])

  // Activer/Désactiver un compte PSP
  const toggleAccountStatus = useCallback(
    async (psp: PspType) => {
      const account = accounts[psp]
      if (!account) return null

      return updateAccount(psp, account.id, { actif: !account.actif })
    },
    [accounts, updateAccount]
  )

  // Vérifier si un PSP est connecté
  const isConnected = useCallback(
    (psp: PspType) => {
      return accounts[psp] !== null && accounts[psp]?.actif === true
    },
    [accounts]
  )

  // Obtenir le compte d'un PSP
  const getAccount = useCallback(
    (psp: PspType) => {
      return accounts[psp]
    },
    [accounts]
  )

  return {
    accounts,
    isLoading,
    loadingPsp,
    connectAccount,
    updateAccount,
    disconnectAccount,
    toggleAccountStatus,
    isConnected,
    getAccount,
    refresh: loadAccounts,
  }
}
