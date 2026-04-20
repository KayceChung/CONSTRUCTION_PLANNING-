import { create } from 'zustand'
import { User } from '../types'
import { supabase } from '../lib/supabase'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  initialize: () => Promise<(() => void) | undefined>
}

async function getStaffUser(session: Session | null): Promise<User | null> {
  if (!session?.user) return null

  const { data: staff, error } = await supabase
    .from('staff')
    .select('id, name, full_name, email, role, avatar, is_active')
    .eq('id', session.user.id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching staff profile:', error)
    return null
  }

  if (!staff || !staff.is_active || !staff.role) {
    return null
  }

  return {
    id: staff.id,
    name: staff.name || staff.full_name || staff.email || '',
    role: staff.role,
    avatar: staff.avatar || undefined,
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialize: async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error('Error restoring auth session:', error)
    }

    const user = await getStaffUser(session)
    set({ user, loading: false })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, nextSession: Session | null) => {
      const nextUser = await getStaffUser(nextSession)
      set({ user: nextUser, loading: false })
    })

    return () => {
      subscription.unsubscribe()
    }
  },
  login: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
  },
  logout: async () => {
    try {
      // 1. Clear user state IMMEDIATELY
      set({ user: null, loading: false })
      
      // 2. Clear ALL storage (localStorage, sessionStorage, cookies, IndexedDB)
      localStorage.clear()
      sessionStorage.clear()
      
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`)
      })
      
      // Clear IndexedDB if exists (Supabase might use it)
      const dbs = await (window.indexedDB.databases?.() || [])
      for (const db of dbs) {
        window.indexedDB.deleteDatabase(db.name)
      }
    } catch (e) {
      console.warn('Error clearing storage:', e)
    }
    
    // 3. Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Supabase signout error:', error)
    }
    
    // 4. Force hard reload to clear all cache
    window.location.href = '/login'
  }
}))
