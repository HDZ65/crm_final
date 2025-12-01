"use client"

import { useCallback, useEffect, useState } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"

export interface StatutClientDto {
  id: string
  code: string
  nom: string
  description?: string
  ordreAffichage: number
  createdAt?: string
  updatedAt?: string
}

export function useStatutClients() {
  const [statuts, setStatuts] = useState<StatutClientDto[]>([])
  const { loading, error, execute } = useApi<StatutClientDto[]>()

  const fetchStatuts = useCallback(async () => {
    try {
      const data = await execute(() => api.get("/statutclients"))
      if (data) {
        // Trier par ordreAffichage
        setStatuts(data.sort((a, b) => a.ordreAffichage - b.ordreAffichage))
      }
    } catch {
      // Error handled by useApi
    }
  }, [execute])

  useEffect(() => {
    fetchStatuts()
  }, [fetchStatuts])

  return {
    statuts,
    loading,
    error,
    refetch: fetchStatuts,
  }
}
