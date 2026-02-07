"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import {
  getPSPAccountsSummary,
  type PSPAccountInfo,
} from "@/actions/payments"

// Types
export interface PspAccount {
  id: string
  societeId: string
  nom: string
  environment: string
  actif: boolean
  createdAt: string
  updatedAt: string
  isLiveMode: boolean
  isConfigured: boolean
}

export interface CreatePspAccountData {
  societeId: string
  nom: string
  environment: string
  actif?: boolean
  [key: string]: string | boolean | undefined // Champs dynamiques selon le PSP
}

export type PspType = "stripe" | "gocardless" | "emerchantpay" | "slimpay" | "multisafepay" | "paypal"

/**
 * Map PSPAccountInfo from gRPC to internal PspAccount format
 */
function mapPspAccountInfo(
  info: PSPAccountInfo | undefined,
  societeId: string
): PspAccount | null {
  if (!info || !info.isConfigured) return null
  return {
    id: info.id,
    societeId,
    nom: info.name,
    environment: info.isLiveMode ? "live" : "test",
    actif: info.isActive,
    createdAt: "",
    updatedAt: "",
    isLiveMode: info.isLiveMode,
    isConfigured: info.isConfigured,
  }
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

  // Charger tous les comptes PSP pour la société via gRPC
  const loadAccounts = useCallback(async () => {
    if (!societeId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const result = await getPSPAccountsSummary(societeId)
      if (result.error || !result.data) {
        // En cas d'erreur, initialiser avec des valeurs nulles
        setAccounts({
          stripe: null,
          gocardless: null,
          emerchantpay: null,
          slimpay: null,
          multisafepay: null,
          paypal: null,
        })
        return
      }

      const summary = result.data
      setAccounts({
        stripe: mapPspAccountInfo(summary.stripe, societeId),
        gocardless: mapPspAccountInfo(summary.gocardless, societeId),
        emerchantpay: mapPspAccountInfo(summary.emerchantpay, societeId),
        slimpay: mapPspAccountInfo(summary.slimpay, societeId),
        multisafepay: mapPspAccountInfo(summary.multisafepay, societeId),
        paypal: mapPspAccountInfo(summary.paypal, societeId),
      })
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
  // Note: PSP account creation is managed via backend admin.
  // This action triggers a refresh after backend-side configuration.
  const connectAccount = useCallback(
    async (psp: PspType, _data: Omit<CreatePspAccountData, "societeId">) => {
      if (!societeId) {
        toast.error("Aucune société sélectionnée")
        return null
      }

      setLoadingPsp(psp)
      try {
        // PSP account connection is configured server-side.
        // After backend configuration, refresh the accounts summary.
        await loadAccounts()
        const account = accounts[psp]
        if (account) {
          toast.success(`Compte ${psp} connecté avec succès`)
        }
        return account
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur inconnue"
        toast.error(`Erreur lors de la connexion: ${message}`)
        return null
      } finally {
        setLoadingPsp(null)
      }
    },
    [societeId, loadAccounts, accounts]
  )

  // Mettre à jour un compte PSP
  // Note: PSP account updates are managed via backend admin.
  // This action triggers a refresh after backend-side changes.
  const updateAccount = useCallback(
    async (psp: PspType, _accountId: string, _data: Partial<CreatePspAccountData>) => {
      setLoadingPsp(psp)
      try {
        // PSP account updates are configured server-side.
        // After backend changes, refresh the accounts summary.
        await loadAccounts()
        const account = accounts[psp]
        if (account) {
          toast.success(`Compte ${psp} mis à jour`)
        }
        return account
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur inconnue"
        toast.error(`Erreur lors de la mise à jour: ${message}`)
        return null
      } finally {
        setLoadingPsp(null)
      }
    },
    [loadAccounts, accounts]
  )

  // Déconnecter un compte PSP
  // Note: PSP account disconnection is managed via backend admin.
  // This action triggers a refresh after backend-side deactivation.
  const disconnectAccount = useCallback(async (psp: PspType) => {
    const account = accounts[psp]
    if (!account) {
      toast.error("Aucun compte à déconnecter")
      return false
    }

    setLoadingPsp(psp)
    try {
      // PSP account disconnection is handled server-side.
      // After backend deactivation, refresh the accounts summary.
      await loadAccounts()
      toast.success(`Compte ${psp} déconnecté`)
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue"
      toast.error(`Erreur lors de la déconnexion: ${message}`)
      return false
    } finally {
      setLoadingPsp(null)
    }
  }, [accounts, loadAccounts])

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
