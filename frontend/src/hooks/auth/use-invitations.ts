"use client"

import { useCallback, useState, useRef } from "react"
import { useApi } from "../core/use-api"
import {
  getAvailableRoles,
  getOrganisationInvitations,
  createInvitation as createInvitationAction,
  deleteInvitation as deleteInvitationAction,
  getOrganisationMembers,
  updateMemberRole as updateMemberRoleAction,
  removeMember as removeMemberAction,
  getMyRole as getMyRoleAction,
} from "@/actions/organisations"
import type {
  InvitationCompteResponse,
  MembrePartenaireResponse,
  RolePartenaireResponse,
} from "@/actions/organisations"

// Types pour compatibilité avec le code existant
export interface OrganisationMemberPartenaire {
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

export interface Invitation {
  id: string
  organisationId: string
  email: string
  roleNom: string
  roleId: string
  inviteUrl?: string
  etat: string
  createdAt: string
  expireAt: string
}

export interface MyRoleMembre {
  id: string
  organisationId: string
  utilisateurId: string
  roleId: string
  etat: string
}

export interface MyRoleRole {
  id: string
  code: string
  nom: string
}

export interface MyRoleResponse {
  membre: MyRoleMembre
  role: MyRoleRole
}

/**
 * Hook pour créer une invitation
 */
export function useCreateInvitation() {
  const [data, setData] = useState<Invitation | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)

  const createInvitation = useCallback(
    async (organisationId: string, email: string, roleId?: string): Promise<Invitation | null> => {
      setError(null)
      setLoading(true)

      try {
        // Utiliser roleId par défaut "member" si non fourni
        const finalRoleId = roleId || "member" // À remplacer par l'ID réel du rôle member

        const result = await createInvitationAction(organisationId, email, finalRoleId)
        if (result.error) {
          setError(new Error(result.error))
          throw new Error(result.error)
        }

        const invitation: Invitation = {
          id: result.data!.id,
          organisationId: result.data!.organisationId,
          email: result.data!.emailInvite,
          roleNom: "member", // À adapter selon la réponse
          roleId: result.data!.roleId,
          etat: result.data!.etat,
          createdAt: result.data!.createdAt,
          expireAt: result.data!.expireAt,
          inviteUrl: `${window.location.origin}/invite/${result.data!.token}`,
        }

        setData(invitation)
        return invitation
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
    error,
    loading,
    createInvitation,
  }
}

/**
 * Hook pour lister les invitations d'une organisation
 */
export function useOrganisationInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchInvitations = useCallback(
    async (organisationId: string) => {
      setLoading(true)
      setError(null)

      try {
        const result = await getOrganisationInvitations(organisationId)
        if (result.error) {
          setError(new Error(result.error))
          setInvitations([])
          return
        }

        const mapped: Invitation[] = result.data!.map((inv) => ({
          id: inv.id,
          organisationId: inv.organisationId,
          email: inv.emailInvite,
          roleNom: "member", // Pourrait être enrichi avec les infos du rôle
          roleId: inv.roleId,
          etat: inv.etat,
          createdAt: inv.createdAt,
          expireAt: inv.expireAt,
          inviteUrl: `${window.location.origin}/invite/${inv.token}`,
        }))

        setInvitations(mapped)
      } catch (err) {
        setError(err as Error)
        setInvitations([])
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    invitations,
    isLoading: loading,
    error,
    fetchInvitations,
  }
}

/**
 * Hook pour annuler une invitation
 */
export function useCancelInvitation() {
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)

  const cancelInvitation = useCallback(
    async (invitationId: string) => {
      setError(null)
      setLoading(true)

      try {
        const result = await deleteInvitationAction(invitationId)
        if (result.error) {
          setError(new Error(result.error))
          throw new Error(result.error)
        }
        return result.data
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
    error,
    loading,
    cancelInvitation,
  }
}

/**
 * Hook pour récupérer les membres d'une organisation
 */
export function useOrganisationMembers() {
  const [members, setMembers] = useState<OrganisationMemberPartenaire[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchMembers = useCallback(
    async (organisationId: string) => {
      setLoading(true)
      setError(null)

      try {
        const result = await getOrganisationMembers(organisationId)
        if (result.error) {
          setError(new Error(result.error))
          setMembers([])
          return
        }

        const mapped: OrganisationMemberPartenaire[] = result.data!.map((m) => ({
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

        setMembers(mapped)
      } catch (err) {
        setError(err as Error)
        setMembers([])
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    members,
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
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)
  const fetchingRef = useRef<string | null>(null)

  const fetchMyRole = useCallback(
    async (organisationId: string, utilisateurId: string) => {
      // Éviter les appels dupliqués
      if (fetchingRef.current === `${organisationId}-${utilisateurId}`) {
        return data
      }

      fetchingRef.current = `${organisationId}-${utilisateurId}`
      setError(null)
      setLoading(true)

      try {
        const result = await getMyRoleAction(organisationId, utilisateurId)
        if (result.error) {
          setError(new Error(result.error))
          setData(null)
          return null
        }

        if (result.data) {
          const mapped: MyRoleResponse = {
            membre: {
              id: result.data.id,
              organisationId: result.data.partenaireId,
              utilisateurId: result.data.utilisateurId,
              roleId: result.data.roleId,
              etat: "actif",
            },
            role: result.data.role ? {
              id: result.data.role.id,
              code: result.data.role.code,
              nom: result.data.role.nom,
            } : { id: "", code: "member", nom: "Membre" },
          }
          setData(mapped)
          return mapped
        }

        setData(null)
        return null
      } catch (err) {
        setError(err as Error)
        setData(null)
        return null
      } finally {
        fetchingRef.current = null
        setLoading(false)
      }
    },
    [data]
  )

  return {
    myRole: data,
    roleCode: data?.role?.code || null,
    error,
    loading,
    fetchMyRole,
  }
}

/**
 * Hook pour récupérer les rôles disponibles pour une organisation
 */
export function useAvailableRoles() {
  const [roles, setRoles] = useState<RolePartenaireResponse[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchRoles = useCallback(
    async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await getAvailableRoles()
        if (result.error) {
          setError(new Error(result.error))
          setRoles([])
          return
        }

        setRoles(result.data || [])
      } catch (err) {
        setError(err as Error)
        setRoles([])
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    roles,
    error,
    loading,
    fetchRoles,
  }
}

/**
 * Hook pour mettre à jour le rôle d'un membre de partenaire
 */
export function useUpdateMemberRolePartenaire() {
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)

  const updateMemberRole = useCallback(
    async (memberId: string, roleId: string) => {
      setError(null)
      setLoading(true)

      try {
        const result = await updateMemberRoleAction(memberId, roleId)
        if (result.error) {
          setError(new Error(result.error))
          throw new Error(result.error)
        }
        return result.data
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
    error,
    loading,
    updateMemberRole,
  }
}

/**
 * Hook pour supprimer un membre d'une organisation (partenaire)
 */
export function useRemoveMemberPartenaire() {
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)

  const removeMember = useCallback(
    async (memberId: string) => {
      setError(null)
      setLoading(true)

      try {
        const result = await removeMemberAction(memberId)
        if (result.error) {
          setError(new Error(result.error))
          throw new Error(result.error)
        }
        return result.data
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
    error,
    loading,
    removeMember,
  }
}

/**
 * Hook pour valider une invitation par token
 */
export function useValidateInvitation() {
  const [validation, setValidation] = useState<InvitationCompteResponse & {
    organisationNom?: string;
    roleNom?: string;
    email?: string;
  } | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)

  const validateInvitation = useCallback(
    async (token: string) => {
      setError(null)
      setLoading(true)

      try {
        const { validateInvitationByToken } = await import("@/actions/organisations")
        const result = await validateInvitationByToken(token)
        if (result.error) {
          setError(new Error(result.error))
          setValidation(null)
          return { valid: false }
        }

        // Transformer les données pour correspondre à ce que la page attend
        const transformed = {
          ...result.data!,
          email: result.data!.emailInvite, // Mapper emailInvite vers email
          expireAt: result.data!.expireAt,
        }

        setValidation(transformed)
        return { valid: true, ...transformed }
      } catch (err) {
        setError(err as Error)
        setValidation(null)
        return { valid: false }
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    validation,
    error,
    loading,
    validateInvitation,
  }
}

/**
 * Hook pour accepter une invitation par token
 */
export function useAcceptInvitation() {
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)

  const acceptInvitation = useCallback(
    async (token: string) => {
      setError(null)
      setLoading(true)

      try {
        const { acceptInvitationByToken } = await import("@/actions/organisations")
        const result = await acceptInvitationByToken(token)
        if (result.error) {
          setError(new Error(result.error))
          return { success: false, error: result.error }
        }

        return { success: true }
      } catch (err) {
        const error = err as Error
        setError(error)
        return { success: false, error: error.message }
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    error,
    loading,
    acceptInvitation,
  }
}

