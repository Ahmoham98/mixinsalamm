import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MixinCredentials, BasalamCredentials } from '../types'

interface AuthState {
  mixinCredentials: MixinCredentials | null
  basalamCredentials: BasalamCredentials | null
  setMixinCredentials: (credentials: MixinCredentials | null) => void
  setBasalamCredentials: (credentials: BasalamCredentials | null) => void
  clearCredentials: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      mixinCredentials: null,
      basalamCredentials: null,
      setMixinCredentials: (credentials) => set({ mixinCredentials: credentials }),
      setBasalamCredentials: (credentials) => set({ basalamCredentials: credentials }),
      clearCredentials: () => set({ mixinCredentials: null, basalamCredentials: null }),
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