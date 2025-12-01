import { create } from "zustand"

export interface ClientSearchFilters {
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
  setFilters: (filters: ClientSearchFilters | ((prev: ClientSearchFilters) => ClientSearchFilters)) => void
  updateFilter: (field: keyof ClientSearchFilters, value: string) => void
  applyQuickSearch: (quickSearchData: { name?: string; email?: string; phone?: string }) => void
  resetFilters: () => void
}

const defaultFilters: ClientSearchFilters = {
  name: "",
  firstName: "",
  email: "",
  phone: "",
  clientType: "",
  company: "",
  iban: "",
  source: "",
}

export const useClientSearchStore = create<ClientSearchStore>((set) => ({
  filters: defaultFilters,

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
}))
