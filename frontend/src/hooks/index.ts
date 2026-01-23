// Core hooks (API, mobile detection)
export * from './core'

// Authentication hooks
export * from './auth'

// Client management hooks
export * from './clients'

// Contract management hooks
export * from './contracts'

// Email and mailing hooks
export * from './email'

// AI-related hooks
export * from './ai'

// Logistics hooks (expeditions, shipping)
export * from './logistics'

// Stats/Dashboard hooks
export * from './stats'

// Commission hooks
export * from './commissions'

// Catalogue/Product hooks
export * from './catalogue'

// State management hooks
export { useAsync, useMutation, useQuery, type AsyncState, type UseAsyncOptions } from './use-async'
export { useFormState, getFieldErrorMessage, hasFieldError, getInputProps, type UseFormStateOptions } from './use-form-state'

// Re-export store selectors as hooks
export {
  useIsLoading,
  useGlobalError,
  useGlobalErrors,
  useIsAppReady,
  useConnectionStatus,
  useCurrentUser,
  useIsAuthenticated,
  useUserFullName,
  useHasPermission,
  useUserPreferences,
  useTheme,
  useActiveOrganisation,
  useActiveOrganisationId,
  useOrganisations,
  useOrganisationMembers,
  useIsOrganisationOwner,
  useOrganisationLoading,
  useModal,
  useSidebar,
  usePageFilters,
  useBreadcrumbs,
  usePageTitle,
  usePageContext,
} from '@/stores/selectors'

// Store hooks direct access
export { useAppStore, useLoadingState, createErrorFromException } from '@/stores/app-store'
export { useUserStore } from '@/stores/user-store'
export { useOrganisationStore } from '@/stores/organisation-store'
export { useUIStore, MODAL_KEYS, type ModalKey } from '@/stores/ui-store'
