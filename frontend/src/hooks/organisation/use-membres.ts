"use client"

import { useCallback, useEffect, useState } from "react"
import { getOrganisationMembers } from "@/actions/organisations"

export interface MembreWithUser {
  id: string
  organisationId: string
  utilisateurId: string
  roleId: string
  etat: string
  dateInvitation: string | null
  dateActivation: string | null
  createdAt: string
  updatedAt: string
  utilisateur?: {
    id: string
    email: string
    nom: string | null
    prenom: string | null
  }
  role?: {
    id: string
    code: string
    nom: string
  }
}

export function useMembres(organisationId: string | undefined) {
  const [membres, setMembres] = useState<MembreWithUser[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchMembres = useCallback(async () => {
    if (!organisationId) return

    setError(null)
    setLoading(true)

    try {
      const result = await getOrganisationMembers(organisationId)
      if (result.error) {
        setError(new Error(result.error))
        setMembres([])
        return
      }

      const mapped: MembreWithUser[] = result.data!.map((m) => ({
        id: m.id,
        organisationId: m.partenaireId,
        utilisateurId: m.utilisateurId,
        roleId: m.roleId,
        etat: "actif", // Par défaut
        dateInvitation: null,
        dateActivation: m.createdAt,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        utilisateur: m.utilisateur ? {
          id: m.utilisateur.id,
          email: m.utilisateur.email,
          nom: m.utilisateur.nom,
          prenom: m.utilisateur.prenom,
        } : undefined,
        role: m.role ? {
          id: m.role.id,
          code: m.role.code,
          nom: m.role.nom,
        } : undefined,
      }))

      // Filtrer pour ne garder que les membres actifs
      setMembres(mapped)
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Erreur lors du chargement des membres")
      )
    } finally {
      setLoading(false)
    }
  }, [organisationId])

  useEffect(() => {
    fetchMembres()
  }, [fetchMembres])

  return {
    membres,
    error,
    loading,
    refetch: fetchMembres,
  }
}
