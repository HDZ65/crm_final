import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SocieteStore {
  activeSocieteId: string | null // null = "Toutes les sociétés"
  setActiveSociete: (id: string | null) => void
  reset: () => void
}

export const useSocieteStore = create<SocieteStore>()(
  persist(
    (set) => ({
      activeSocieteId: null,
      setActiveSociete: (id) => set({ activeSocieteId: id }),
      reset: () => set({ activeSocieteId: null }),
    }),
    { name: "active-societe" }
  )
)
