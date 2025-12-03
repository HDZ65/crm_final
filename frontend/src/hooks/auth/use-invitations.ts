"use client"

import { useCallback, useState, useRef } from "react"
import { useApi } from "../core/use-api"
import { api } from "@/lib/api"
import type {
  OrganisationMember,
  Invitation,
  InvitationValidation,
  InvitationAcceptResponse,
  MyRoleResponse,
} from "@/types/invitation"

// Re-export des types pour compatibilité avec les imports existants
export type {
  OrganisationMember,
  OrganisationMemberUtilisateur,
  OrganisationMemberRole,
  Invitation,
  InvitationValidation,
  InvitationAcceptResponse,
  CreateInvitationDto,
  MyRoleMembre,
  MyRoleRole,
  MyRoleResponse,
} from "@/types/invitation"

/**
 * Hook pour créer une invitation
 */
export function useCreateInvitation() {
  const [data, setData] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createInvitation = useCallback(
    async (organisationId: string, email: string): Promise<Invitation | null> => {
      setLoading(true)
      setError(null)

      const url = `/invitations/organisation/${organisationId}`
      const body = { emailInvite: email }

      try {
        const result = await api.post<Invitation>(url, body)
        setData(result)
        return result
      } catch (err) {
        setError(err as Error)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    invitation: data,
    isLoading: loading,
    error,
    createInvitation,
  }
}

/**
 * Hook pour lister les invitations d'une organisation
 */
export function useOrganisationInvitations() {
  const { data, loading, error, execute, reset } = useApi<Invitation[]>()

  const fetchInvitations = useCallback(
    async (organisationId: string) => {
      return execute(() => api.get(`/invitations/organisation/${organisationId}`))
    },
    [execute]
  )

  return {
    invitations: data || [],
    isLoading: loading,
    error,
    fetchInvitations,
    reset,
  }
}

/**
 * Hook pour annuler une invitation
 */
export function useCancelInvitation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const cancelInvitation = useCallback(
    async (invitationId: string) => {
      setLoading(true)
      setError(null)

      const url = `/invitations/${invitationId}`

      try {
        const result = await api.delete(url)
        return result
      } catch (err) {
        setError(err as Error)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    isLoading: loading,
    error,
    cancelInvitation,
  }
}

/**
 * Hook pour valider une invitation (vérifier si le token est valide)
 */
export function useValidateInvitation() {
  const [data, setData] = useState<InvitationValidation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const validateInvitation = useCallback(
    async (token: string): Promise<InvitationValidation | null> => {
      setLoading(true)
      setError(null)

      const url = `/invitations/validate/${token}`

      try {
        const result = await api.get<InvitationValidation>(url)
        setData(result)
        return result
      } catch (err) {
        setError(err as Error)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    validation: data,
    isLoading: loading,
    error,
    validateInvitation,
  }
}

/**
 * Hook pour accepter une invitation
 */
export function useAcceptInvitation() {
  const [data, setData] = useState<InvitationAcceptResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const acceptInvitation = useCallback(
    async (token: string): Promise<InvitationAcceptResponse | null> => {
      setLoading(true)
      setError(null)

      const url = `/invitations/accept/${token}`

      try {
        const result = await api.post<InvitationAcceptResponse>(url, {})
        setData(result)
        return result
      } catch (err) {
        setError(err as Error)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    result: data,
    isLoading: loading,
    error,
    acceptInvitation,
  }
}

/**
 * Hook pour récupérer les membres d'une organisation
 */
export function useOrganisationMembers() {
  const { data, loading, error, execute } = useApi<OrganisationMember[]>()

  const fetchMembers = useCallback(
    async (organisationId: string) => {
      return execute(() => api.get(`/membrecomptes/organisation/${organisationId}`))
    },
    [execute]
  )

  return {
    members: data || [],
    isLoading: loading,
    error,
    fetchMembers,
  }
}

/**
 * Hook pour récupérer le rôle de l'utilisateur dans une organisation
 */
export function useMyRole() {
  const [data, setData] = useState<MyRoleResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const fetchingRef = useRef<string | null>(null)

  const fetchMyRole = useCallback(
    async (organisationId: string) => {
      // Éviter les appels dupliqués pour la même organisation
      if (fetchingRef.current === organisationId) {
        return data
      }

      fetchingRef.current = organisationId
      setLoading(true)
      setError(null)

      try {
        const result = await api.get<MyRoleResponse>(`/membrecomptes/my-role/${organisationId}`)
        setData(result)
        return result
      } catch (err) {
        setError(err as Error)
        throw err
      } finally {
        setLoading(false)
        fetchingRef.current = null
      }
    },
    [data]
  )

  return {
    myRole: data,
    roleCode: data?.role?.code || null,
    isLoading: loading,
    error,
    fetchMyRole,
  }
}
