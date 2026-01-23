/**
 * Selectors - Selecteurs reutilisables pour les stores
 * 
 * Ces hooks fournissent un acces simplifie aux parties communes des stores
 * avec une optimisation de re-renders grace a la selection fine.
 */

import { useAppStore } from './app-store'
import { useUserStore } from './user-store'
import { useOrganisationStore } from './organisation-store'
import { useUIStore } from './ui-store'

// ============================================
// App Selectors
// ============================================

/**
 * Verifie si une operation specifique est en cours
 */
export function useIsLoading(key?: string) {
  return useAppStore((state) => {
    if (!key) {
      return Object.keys(state.loadingStates).length > 0
    }
    return !!state.loadingStates[key]
  })
}

/**
 * Recupere la derniere erreur globale
 */
export function useGlobalError() {
  return useAppStore((state) => state.lastError)
}

/**
 * Recupere toutes les erreurs globales
 */
export function useGlobalErrors() {
  return useAppStore((state) => state.globalErrors)
}

/**
 * Verifie si l'app est prete
 */
export function useIsAppReady() {
  return useAppStore((state) => state.isAppReady && !state.isInitializing)
}

/**
 * Verifie la connexion
 */
export function useConnectionStatus() {
  return useAppStore((state) => ({
    isOnline: state.isOnline,
    isServerReachable: state.isServerReachable,
  }))
}

// ============================================
// User Selectors
// ============================================

/**
 * Recupere l'utilisateur courant
 */
export function useCurrentUser() {
  return useUserStore((state) => state.profile)
}

/**
 * Verifie si l'utilisateur est authentifie
 */
export function useIsAuthenticated() {
  return useUserStore((state) => state.isAuthenticated)
}

/**
 * Recupere le nom complet de l'utilisateur
 */
export function useUserFullName() {
  return useUserStore((state) => {
    if (!state.profile) return ''
    return `${state.profile.prenom} ${state.profile.nom}`.trim()
  })
}

/**
 * Verifie les permissions
 */
export function useHasPermission(permission: string) {
  return useUserStore((state) => {
    if (!state.profile) return false
    if (state.profile.role === 'ADMIN') return true
    return state.profile.permissions.includes(permission)
  })
}

/**
 * Recupere les preferences utilisateur
 */
export function useUserPreferences() {
  return useUserStore((state) => state.preferences)
}

/**
 * Recupere le theme actuel
 */
export function useTheme() {
  return useUserStore((state) => state.preferences.theme)
}

// ============================================
// Organisation Selectors
// ============================================

/**
 * Recupere l'organisation active
 */
export function useActiveOrganisation() {
  return useOrganisationStore((state) => state.activeOrganisation)
}

/**
 * Recupere l'ID de l'organisation active
 */
export function useActiveOrganisationId() {
  return useOrganisationStore((state) => state.activeOrganisation?.id)
}

/**
 * Recupere la liste des organisations
 */
export function useOrganisations() {
  return useOrganisationStore((state) => state.organisations)
}

/**
 * Recupere les membres de l'organisation active
 */
export function useOrganisationMembers() {
  return useOrganisationStore((state) => state.members)
}

/**
 * Verifie si l'utilisateur est owner de l'organisation
 */
export function useIsOrganisationOwner(userId: string) {
  return useOrganisationStore((state) => {
    const member = state.members.find((m) => m.userId === userId)
    return member?.role === 'OWNER'
  })
}

/**
 * Recupere l'etat de chargement de l'organisation
 */
export function useOrganisationLoading() {
  return useOrganisationStore((state) => ({
    isLoading: state.isLoading,
    isSwitching: state.isSwitching,
  }))
}

// ============================================
// UI Selectors
// ============================================

/**
 * Recupere l'etat d'un modal
 */
export function useModal(key: string) {
  const isOpen = useUIStore((state) => state.modals[key]?.isOpen ?? false)
  const data = useUIStore((state) => state.modals[key]?.data)
  const openModal = useUIStore((state) => state.openModal)
  const closeModal = useUIStore((state) => state.closeModal)
  
  return {
    isOpen,
    data,
    open: (modalData?: unknown) => openModal(key, modalData),
    close: () => closeModal(key),
  }
}

/**
 * Recupere l'etat de la sidebar
 */
export function useSidebar() {
  const sidebar = useUIStore((state) => state.sidebar)
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const setSidebarCollapsed = useUIStore((state) => state.setSidebarCollapsed)
  const toggleSidebarCollapse = useUIStore((state) => state.toggleSidebarCollapse)
  
  return {
    ...sidebar,
    setOpen: setSidebarOpen,
    toggle: toggleSidebar,
    setCollapsed: setSidebarCollapsed,
    toggleCollapse: toggleSidebarCollapse,
  }
}

/**
 * Recupere les filtres pour une page
 */
export function usePageFilters(page: string) {
  const filters = useUIStore((state) => state.getFilters(page))
  const setFilter = useUIStore((state) => state.setFilter)
  const resetFilters = useUIStore((state) => state.resetFilters)
  
  return {
    ...filters,
    setFilter: (filter: Parameters<typeof setFilter>[1]) => setFilter(page, filter),
    reset: () => resetFilters(page),
  }
}

/**
 * Recupere les breadcrumbs
 */
export function useBreadcrumbs() {
  return useUIStore((state) => state.breadcrumbs)
}

/**
 * Recupere le titre de la page
 */
export function usePageTitle() {
  return useUIStore((state) => state.pageTitle)
}

// ============================================
// Combined Selectors
// ============================================

/**
 * Context complet pour les pages (user + organisation + UI)
 */
export function usePageContext() {
  const user = useCurrentUser()
  const organisation = useActiveOrganisation()
  const isLoading = useIsLoading()
  const error = useGlobalError()
  
  return {
    user,
    organisation,
    isLoading,
    error,
    isReady: !!user && !!organisation,
  }
}
