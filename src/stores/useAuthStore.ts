import { create } from 'zustand'
import { User } from '../types'
import { loadUser, saveUser } from '../utils/storage'

interface AuthState {
  user: User | null
  login: (user: User) => void
  logout: () => void
}

const storedUser = loadUser()

export const useAuthStore = create<AuthState>((set) => ({
  user: storedUser,
  login: (user) => {
    saveUser(user)
    set({ user })
  },
  logout: () => {
    saveUser(null)
    set({ user: null })
  }
}))
