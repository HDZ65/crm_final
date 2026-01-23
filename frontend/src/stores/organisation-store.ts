/**
 * Organisation Store - Gestion des organisations
 * 
 * Gere:
 * - Organisation active
 * - Liste des organisations de l'utilisateur
 * - Membres et invitations
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// ============================================
// Types
// ============================================

export interface Organisation {
  id: string
  nom: string
  slug: string
  logo?: string
  secteurActivite?: string
  adresse?: string
  codePostal?: string
  ville?: string
  pays?: string
  telephone?: string
  email?: string
  siren?: string
  siret?: string
  tvaIntracom?: string
  createdAt: string
  updatedAt: string
}

export interface OrganisationMember {
  id: string
  userId: string
  email: string
  nom: string
  prenom: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  joinedAt: string
}

export interface OrganisationInvitation {
  id: string
  email: string
  role: 'ADMIN' | 'MEMBER' | 'VIEWER'
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'
  expiresAt: string
  createdAt: string
}

export interface OrganisationState {
  // State
  activeOrganisation: Organisation | null
  organisations: Organisation[]
  members: OrganisationMember[]
  invitations: OrganisationInvitation[]
  
  // Loading states
  isLoading: boolean
  isSwitching: boolean
  isMembersLoading: boolean
  
  // Error states
  error: string | null
  
  // Actions - Organisation
  setActiveOrganisation: (org: Organisation | null) => void
  setOrganisations: (orgs: Organisation[]) => void
  addOrganisation: (org: Organisation) => void
  updateOrganisation: (id: string, updates: Partial<Organisation>) => void
  removeOrganisation: (id: string) => void
  
  // Actions - Members
  setMembers: (members: OrganisationMember[]) => void
  addMember: (member: OrganisationMember) => void
  removeMember: (userId: string) => void
  updateMemberRole: (userId: string, role: OrganisationMember['role']) => void
  
  // Actions - Invitations
  setInvitations: (invitations: OrganisationInvitation[]) => void
  addInvitation: (invitation: OrganisationInvitation) => void
  removeInvitation: (id: string) => void
  updateInvitationStatus: (id: string, status: OrganisationInvitation['status']) => void
  
  // Actions - Loading
  setLoading: (loading: boolean) => void
  setSwitching: (switching: boolean) => void
  setMembersLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Actions - Reset
  reset: () => void
  
  // Selectors
  getOrganisationById: (id: string) => Organisation | undefined
  getMemberByUserId: (userId: string) => OrganisationMember | undefined
  getPendingInvitations: () => OrganisationInvitation[]
  isOwner: (userId: string) => boolean
  canManageMembers: (userId: string) => boolean
}

// ============================================
// Store
// ============================================

const initialState = {
  activeOrganisation: null,
  organisations: [],
  members: [],
  invitations: [],
  isLoading: false,
  isSwitching: false,
  isMembersLoading: false,
  error: null,
}

export const useOrganisationStore = create<OrganisationState>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // Organisation actions
        setActiveOrganisation: (org) =>
          set((state) => {
            state.activeOrganisation = org
            state.error = null
          }),

        setOrganisations: (orgs) =>
          set((state) => {
            state.organisations = orgs
          }),

        addOrganisation: (org) =>
          set((state) => {
            state.organisations.push(org)
          }),

        updateOrganisation: (id, updates) =>
          set((state) => {
            const index = state.organisations.findIndex((o) => o.id === id)
            if (index !== -1) {
              Object.assign(state.organisations[index], updates)
            }
            if (state.activeOrganisation?.id === id) {
              Object.assign(state.activeOrganisation, updates)
            }
          }),

        removeOrganisation: (id) =>
          set((state) => {
            state.organisations = state.organisations.filter((o) => o.id !== id)
            if (state.activeOrganisation?.id === id) {
              state.activeOrganisation = state.organisations[0] || null
            }
          }),

        // Members actions
        setMembers: (members) =>
          set((state) => {
            state.members = members
          }),

        addMember: (member) =>
          set((state) => {
            state.members.push(member)
          }),

        removeMember: (userId) =>
          set((state) => {
            state.members = state.members.filter((m) => m.userId !== userId)
          }),

        updateMemberRole: (userId, role) =>
          set((state) => {
            const member = state.members.find((m) => m.userId === userId)
            if (member) {
              member.role = role
            }
          }),

        // Invitations actions
        setInvitations: (invitations) =>
          set((state) => {
            state.invitations = invitations
          }),

        addInvitation: (invitation) =>
          set((state) => {
            state.invitations.push(invitation)
          }),

        removeInvitation: (id) =>
          set((state) => {
            state.invitations = state.invitations.filter((i) => i.id !== id)
          }),

        updateInvitationStatus: (id, status) =>
          set((state) => {
            const invitation = state.invitations.find((i) => i.id === id)
            if (invitation) {
              invitation.status = status
            }
          }),

        // Loading actions
        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading
          }),

        setSwitching: (switching) =>
          set((state) => {
            state.isSwitching = switching
          }),

        setMembersLoading: (loading) =>
          set((state) => {
            state.isMembersLoading = loading
          }),

        setError: (error) =>
          set((state) => {
            state.error = error
          }),

        // Reset
        reset: () => set(initialState),

        // Selectors
        getOrganisationById: (id) => get().organisations.find((o) => o.id === id),
        
        getMemberByUserId: (userId) => get().members.find((m) => m.userId === userId),
        
        getPendingInvitations: () => get().invitations.filter((i) => i.status === 'PENDING'),
        
        isOwner: (userId) => {
          const member = get().members.find((m) => m.userId === userId)
          return member?.role === 'OWNER'
        },
        
        canManageMembers: (userId) => {
          const member = get().members.find((m) => m.userId === userId)
          return member?.role === 'OWNER' || member?.role === 'ADMIN'
        },
      })),
      {
        name: 'organisation-store',
        // Ne persister que l'ID de l'organisation active
        partialize: (state) => ({
          activeOrganisationId: state.activeOrganisation?.id,
        }),
      }
    ),
    { name: 'organisation-store' }
  )
)
