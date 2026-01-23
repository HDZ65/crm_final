/**
 * User Store - Profil utilisateur et session
 * 
 * Gere:
 * - Profil utilisateur courant
 * - Preferences utilisateur
 * - Etat de la session
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// ============================================
// Types
// ============================================

export interface UserProfile {
  id: string
  keycloakId: string
  email: string
  nom: string
  prenom: string
  telephone?: string
  avatar?: string
  role: 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER'
  permissions: string[]
  createdAt: string
  updatedAt: string
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: 'fr' | 'en'
  notifications: {
    email: boolean
    push: boolean
    sound: boolean
  }
  dashboard: {
    defaultView: string
    widgets: string[]
  }
}

export interface UserState {
  // State
  profile: UserProfile | null
  preferences: UserPreferences
  isAuthenticated: boolean
  isProfileLoading: boolean
  profileError: string | null
  
  // Actions - Profile
  setProfile: (profile: UserProfile | null) => void
  updateProfile: (updates: Partial<UserProfile>) => void
  clearProfile: () => void
  
  // Actions - Preferences
  setPreferences: (preferences: Partial<UserPreferences>) => void
  setTheme: (theme: UserPreferences['theme']) => void
  setLanguage: (language: UserPreferences['language']) => void
  toggleNotification: (type: keyof UserPreferences['notifications']) => void
  
  // Actions - Loading
  setProfileLoading: (loading: boolean) => void
  setProfileError: (error: string | null) => void
  
  // Selectors
  hasPermission: (permission: string) => boolean
  isAdmin: () => boolean
  isManager: () => boolean
  getFullName: () => string
}

// ============================================
// Default values
// ============================================

const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'fr',
  notifications: {
    email: true,
    push: true,
    sound: false,
  },
  dashboard: {
    defaultView: 'overview',
    widgets: ['tasks', 'clients', 'contracts', 'activities'],
  },
}

// ============================================
// Store
// ============================================

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        profile: null,
        preferences: defaultPreferences,
        isAuthenticated: false,
        isProfileLoading: false,
        profileError: null,

        // Profile actions
        setProfile: (profile) =>
          set((state) => {
            state.profile = profile
            state.isAuthenticated = !!profile
            state.profileError = null
          }),

        updateProfile: (updates) =>
          set((state) => {
            if (state.profile) {
              Object.assign(state.profile, updates)
            }
          }),

        clearProfile: () =>
          set((state) => {
            state.profile = null
            state.isAuthenticated = false
            state.profileError = null
          }),

        // Preferences actions
        setPreferences: (preferences) =>
          set((state) => {
            Object.assign(state.preferences, preferences)
          }),

        setTheme: (theme) =>
          set((state) => {
            state.preferences.theme = theme
          }),

        setLanguage: (language) =>
          set((state) => {
            state.preferences.language = language
          }),

        toggleNotification: (type) =>
          set((state) => {
            state.preferences.notifications[type] = !state.preferences.notifications[type]
          }),

        // Loading actions
        setProfileLoading: (loading) =>
          set((state) => {
            state.isProfileLoading = loading
          }),

        setProfileError: (error) =>
          set((state) => {
            state.profileError = error
          }),

        // Selectors
        hasPermission: (permission) => {
          const { profile } = get()
          if (!profile) return false
          if (profile.role === 'ADMIN') return true
          return profile.permissions.includes(permission)
        },

        isAdmin: () => get().profile?.role === 'ADMIN',
        
        isManager: () => {
          const role = get().profile?.role
          return role === 'ADMIN' || role === 'MANAGER'
        },

        getFullName: () => {
          const { profile } = get()
          if (!profile) return ''
          return `${profile.prenom} ${profile.nom}`.trim()
        },
      })),
      {
        name: 'user-preferences',
        // Ne persister que les preferences, pas le profil
        partialize: (state) => ({ preferences: state.preferences }),
      }
    ),
    { name: 'user-store' }
  )
)
