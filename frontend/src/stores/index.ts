/**
 * Zustand Stores - Point d'entree central
 * 
 * Architecture:
 * - appStore: Etat global de l'application (loading, errors, UI)
 * - userStore: Profil utilisateur et session
 * - organisationStore: Organisation active et liste
 * - uiStore: Etat UI (modals, sidebars, filtres)
 */

export { useAppStore, type AppState, type GlobalError } from './app-store'
export { useUserStore, type UserState, type UserProfile } from './user-store'
export { useOrganisationStore, type OrganisationState } from './organisation-store'
export { useUIStore, type UIState } from './ui-store'

// Re-export des selecteurs utilitaires
export { 
  useIsLoading, 
  useGlobalError, 
  useActiveOrganisation,
  useCurrentUser,
} from './selectors'
