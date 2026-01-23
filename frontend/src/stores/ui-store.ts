/**
 * UI Store - Etat de l'interface utilisateur
 * 
 * Gere:
 * - Modals et dialogs
 * - Sidebars et panels
 * - Filtres et recherche
 * - Etats temporaires UI
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// ============================================
// Types
// ============================================

export interface ModalState {
  isOpen: boolean
  data?: unknown
}

export interface FilterState {
  search: string
  status: string[]
  dateRange: {
    from: string | null
    to: string | null
  }
  sortBy: string
  sortOrder: 'asc' | 'desc'
  page: number
  limit: number
}

export interface SidebarState {
  isOpen: boolean
  isCollapsed: boolean
}

export interface PanelState {
  isOpen: boolean
  data?: unknown
}

export interface UIState {
  // Modals
  modals: Record<string, ModalState>
  
  // Sidebars
  sidebar: SidebarState
  rightPanel: PanelState
  
  // Filtres par page
  filters: Record<string, FilterState>
  
  // Breadcrumb
  breadcrumbs: Array<{ label: string; href?: string }>
  
  // Page title
  pageTitle: string
  
  // Command palette
  isCommandPaletteOpen: boolean
  
  // Mobile menu
  isMobileMenuOpen: boolean
  
  // Actions - Modals
  openModal: (key: string, data?: unknown) => void
  closeModal: (key: string) => void
  toggleModal: (key: string, data?: unknown) => void
  closeAllModals: () => void
  getModalState: (key: string) => ModalState
  
  // Actions - Sidebar
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebarCollapse: () => void
  
  // Actions - Right Panel
  openRightPanel: (data?: unknown) => void
  closeRightPanel: () => void
  toggleRightPanel: (data?: unknown) => void
  
  // Actions - Filters
  setFilter: (page: string, filter: Partial<FilterState>) => void
  resetFilters: (page: string) => void
  getFilters: (page: string) => FilterState
  
  // Actions - Breadcrumb
  setBreadcrumbs: (breadcrumbs: Array<{ label: string; href?: string }>) => void
  addBreadcrumb: (breadcrumb: { label: string; href?: string }) => void
  
  // Actions - Page
  setPageTitle: (title: string) => void
  
  // Actions - Command Palette
  openCommandPalette: () => void
  closeCommandPalette: () => void
  toggleCommandPalette: () => void
  
  // Actions - Mobile
  setMobileMenuOpen: (open: boolean) => void
  toggleMobileMenu: () => void
  
  // Actions - Reset
  reset: () => void
}

// ============================================
// Default values
// ============================================

const defaultFilterState: FilterState = {
  search: '',
  status: [],
  dateRange: { from: null, to: null },
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  limit: 20,
}

const initialState = {
  modals: {},
  sidebar: { isOpen: true, isCollapsed: false },
  rightPanel: { isOpen: false, data: undefined },
  filters: {},
  breadcrumbs: [],
  pageTitle: '',
  isCommandPaletteOpen: false,
  isMobileMenuOpen: false,
}

// ============================================
// Store
// ============================================

export const useUIStore = create<UIState>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // Modal actions
      openModal: (key, data) =>
        set((state) => {
          state.modals[key] = { isOpen: true, data }
        }),

      closeModal: (key) =>
        set((state) => {
          if (state.modals[key]) {
            state.modals[key].isOpen = false
          }
        }),

      toggleModal: (key, data) =>
        set((state) => {
          const current = state.modals[key]
          if (current?.isOpen) {
            current.isOpen = false
          } else {
            state.modals[key] = { isOpen: true, data }
          }
        }),

      closeAllModals: () =>
        set((state) => {
          Object.keys(state.modals).forEach((key) => {
            state.modals[key].isOpen = false
          })
        }),

      getModalState: (key) => get().modals[key] || { isOpen: false },

      // Sidebar actions
      setSidebarOpen: (open) =>
        set((state) => {
          state.sidebar.isOpen = open
        }),

      toggleSidebar: () =>
        set((state) => {
          state.sidebar.isOpen = !state.sidebar.isOpen
        }),

      setSidebarCollapsed: (collapsed) =>
        set((state) => {
          state.sidebar.isCollapsed = collapsed
        }),

      toggleSidebarCollapse: () =>
        set((state) => {
          state.sidebar.isCollapsed = !state.sidebar.isCollapsed
        }),

      // Right Panel actions
      openRightPanel: (data) =>
        set((state) => {
          state.rightPanel = { isOpen: true, data }
        }),

      closeRightPanel: () =>
        set((state) => {
          state.rightPanel.isOpen = false
        }),

      toggleRightPanel: (data) =>
        set((state) => {
          if (state.rightPanel.isOpen) {
            state.rightPanel.isOpen = false
          } else {
            state.rightPanel = { isOpen: true, data }
          }
        }),

      // Filter actions
      setFilter: (page, filter) =>
        set((state) => {
          if (!state.filters[page]) {
            state.filters[page] = { ...defaultFilterState }
          }
          Object.assign(state.filters[page], filter)
        }),

      resetFilters: (page) =>
        set((state) => {
          state.filters[page] = { ...defaultFilterState }
        }),

      getFilters: (page) => get().filters[page] || { ...defaultFilterState },

      // Breadcrumb actions
      setBreadcrumbs: (breadcrumbs) =>
        set((state) => {
          state.breadcrumbs = breadcrumbs
        }),

      addBreadcrumb: (breadcrumb) =>
        set((state) => {
          state.breadcrumbs.push(breadcrumb)
        }),

      // Page actions
      setPageTitle: (title) =>
        set((state) => {
          state.pageTitle = title
        }),

      // Command Palette actions
      openCommandPalette: () =>
        set((state) => {
          state.isCommandPaletteOpen = true
        }),

      closeCommandPalette: () =>
        set((state) => {
          state.isCommandPaletteOpen = false
        }),

      toggleCommandPalette: () =>
        set((state) => {
          state.isCommandPaletteOpen = !state.isCommandPaletteOpen
        }),

      // Mobile actions
      setMobileMenuOpen: (open) =>
        set((state) => {
          state.isMobileMenuOpen = open
        }),

      toggleMobileMenu: () =>
        set((state) => {
          state.isMobileMenuOpen = !state.isMobileMenuOpen
        }),

      // Reset
      reset: () => set(initialState),
    })),
    { name: 'ui-store' }
  )
)

// ============================================
// Modal keys constants
// ============================================

export const MODAL_KEYS = {
  // Clients
  CREATE_CLIENT: 'create-client',
  EDIT_CLIENT: 'edit-client',
  DELETE_CLIENT: 'delete-client',
  
  // Contrats
  CREATE_CONTRAT: 'create-contrat',
  EDIT_CONTRAT: 'edit-contrat',
  DELETE_CONTRAT: 'delete-contrat',
  
  // Commerciaux
  CREATE_COMMERCIAL: 'create-commercial',
  EDIT_COMMERCIAL: 'edit-commercial',
  
  // Taches
  CREATE_TACHE: 'create-tache',
  EDIT_TACHE: 'edit-tache',
  
  // Documents
  UPLOAD_DOCUMENT: 'upload-document',
  PREVIEW_DOCUMENT: 'preview-document',
  
  // Organisation
  INVITE_MEMBER: 'invite-member',
  EDIT_ORGANISATION: 'edit-organisation',
  
  // Confirmation generique
  CONFIRM: 'confirm',
} as const

export type ModalKey = typeof MODAL_KEYS[keyof typeof MODAL_KEYS]
