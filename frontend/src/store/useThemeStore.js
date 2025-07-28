import { create } from 'zustand'

export const useThemeStore = create((set) => ({
  theme: "naw",
  seTheme: (theme) => set({ theme }),
}))