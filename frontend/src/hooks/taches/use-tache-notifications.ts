"use client"

import { useCallback, useEffect, useRef } from "react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import type { TacheDto } from "@/types/tache"

interface TacheNotificationsOptions {
  enabled?: boolean
}

interface TachesAlerteResponse {
  enRetard: TacheDto[]
  echeanceDemain: TacheDto[]
}

/**
 * Hook pour afficher des notifications pour mes tâches en retard
 * et celles dont l'échéance est demain (dernier jour)
 */
export function useTacheNotifications(options: TacheNotificationsOptions = {}) {
  const { enabled = true } = options
  const hasNotified = useRef(false)

  const checkAndNotify = useCallback(async () => {
    if (hasNotified.current) return

    try {
      const data = await api.get<TachesAlerteResponse>("/taches/alertes")

      const { enRetard, echeanceDemain } = data

      // Notification pour les tâches en retard
      if (enRetard.length > 0) {
        toast.error(
          `${enRetard.length} tâche${enRetard.length > 1 ? "s" : ""} en retard`,
          {
            description: enRetard.length === 1
              ? `"${enRetard[0].titre}" est en retard`
              : `Vous avez ${enRetard.length} tâches en retard à traiter`,
            duration: 8000,
            action: {
              label: "Voir",
              onClick: () => {
                window.dispatchEvent(new CustomEvent("tache:show-retard"))
              },
            },
          }
        )
      }

      // Notification pour les tâches dont l'échéance est demain
      if (echeanceDemain.length > 0) {
        toast.warning(
          `${echeanceDemain.length} tâche${echeanceDemain.length > 1 ? "s" : ""} - dernier jour demain`,
          {
            description: echeanceDemain.length === 1
              ? `"${echeanceDemain[0].titre}" doit être terminée demain`
              : `${echeanceDemain.length} tâches doivent être terminées demain`,
            duration: 8000,
          }
        )
      }

      hasNotified.current = true
    } catch (error) {
      // Silently fail - notifications are not critical
      console.debug("[TacheNotifications] Error fetching alerts:", error)
    }
  }, [])

  useEffect(() => {
    if (enabled) {
      // Small delay to let the page load first
      const timer = setTimeout(checkAndNotify, 1000)
      return () => clearTimeout(timer)
    }
  }, [enabled, checkAndNotify])

  return {
    checkAndNotify,
  }
}
