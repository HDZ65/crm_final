import { create } from "zustand"

export interface ClientSearchFilters {
  globalSearch: string
  name: string
  firstName: string
  email: string
  phone: string
  clientType: string
  company: string
  iban: string
  source: string
}

interface ClientSearchStore {
  filters: ClientSearchFilters
  showAdvancedFilters: boolean
  setFilters: (filters: ClientSearchFilters | ((prev: ClientSearchFilters) => ClientSearchFilters)) => void
  updateFilter: (field: keyof ClientSearchFilters, value: string) => void
  toggleAdvancedFilters: () => void
  applyQuickSearch: (quickSearchData: { name?: string; email?: string; phone?: string }) => void
  resetFilters: () => void
  hasActiveAdvancedFilters: () => boolean
}

const defaultFilters: ClientSearchFilters = {
  globalSearch: "",
  name: "",
  firstName: "",
  email: "",
  phone: "",
  clientType: "",
  company: "",
  iban: "",
  source: "",
}

export const useClientSearchStore = create<ClientSearchStore>((set, get) => ({
  filters: defaultFilters,
  showAdvancedFilters: false,

  setFilters: (filtersOrUpdater) =>
    set((state) => ({
      filters: typeof filtersOrUpdater === "function" ? filtersOrUpdater(state.filters) : filtersOrUpdater,
    })),

  updateFilter: (field, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [field]: value,
      },
    })),

  toggleAdvancedFilters: () =>
    set((state) => ({ showAdvancedFilters: !state.showAdvancedFilters })),

  applyQuickSearch: (quickSearchData) =>
    set((state) => ({
      filters: {
        ...state.filters,
        name: quickSearchData.name || "",
        email: quickSearchData.email || "",
        phone: quickSearchData.phone || "",
      },
    })),

  resetFilters: () => set({ filters: defaultFilters }),

  hasActiveAdvancedFilters: () => {
    const { filters } = get()
    return !!(
      filters.name ||
      filters.firstName ||
      filters.email ||
      filters.phone ||
      filters.clientType ||
      filters.company ||
      filters.iban ||
      filters.source
    )
  },
}))
