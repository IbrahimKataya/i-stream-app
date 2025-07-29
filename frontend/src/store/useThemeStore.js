import { create } from 'zustand'

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("I-STREAM_theme") || "dark",
  setTheme: (theme) =>{ 
    localStorage.setItem("I-STREAM_theme", theme);
    set({ theme });
  },
}))