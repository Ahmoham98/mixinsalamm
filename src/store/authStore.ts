import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MixinCredentials, BasalamCredentials } from '../types'

interface UserSettings {
  autoSyncEnabled: boolean
}

interface AuthState {
  mixinCredentials: MixinCredentials | null
  basalamCredentials: BasalamCredentials | null
  settings: UserSettings
  setMixinCredentials: (credentials: MixinCredentials | null) => void
  setBasalamCredentials: (credentials: BasalamCredentials | null) => void
  updateSettings: (settings: Partial<UserSettings>) => void
  clearCredentials: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      mixinCredentials: null,
      basalamCredentials: null,
      settings: {
        autoSyncEnabled: false
      },
      setMixinCredentials: (credentials) => set({ mixinCredentials: credentials }),
      setBasalamCredentials: (credentials) => set({ basalamCredentials: credentials }),
      updateSettings: (newSettings) => set((state) => ({ 
        settings: { ...state.settings, ...newSettings } 
      })),
      clearCredentials: () => set({ 
        mixinCredentials: null, 
        basalamCredentials: null,
        settings: { autoSyncEnabled: false }
      }),
      isAuthenticated: () => {
        const state = get()
        return !!(state.mixinCredentials && state.basalamCredentials)
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)