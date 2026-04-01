import { create } from 'zustand'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthUser {
  user_id: string
  email: string
  display_name: string
  created_at: number
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName?: string) => Promise<void>
  logout: () => Promise<void>
  loadSession: () => Promise<void>
  clearError: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'arctis_auth_token'

function getBaseUrl(): string {
  // Reuse the same engine URL logic as the rest of the app
  return localStorage.getItem('arctis_engine_url') || 'http://localhost:28080'
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${getBaseUrl()}${path}`
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem(STORAGE_KEY),
  user: null,
  isAuthenticated: !!localStorage.getItem(STORAGE_KEY),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const res = await authFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Login failed' }))
        throw new Error(data.detail || `Error ${res.status}`)
      }

      const data = await res.json()
      localStorage.setItem(STORAGE_KEY, data.token)
      set({
        token: data.token,
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Login failed',
      })
      throw err
    }
  },

  register: async (email: string, password: string, displayName?: string) => {
    set({ isLoading: true, error: null })
    try {
      const res = await authFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          display_name: displayName || '',
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Registration failed' }))
        throw new Error(data.detail || `Error ${res.status}`)
      }

      const data = await res.json()
      localStorage.setItem(STORAGE_KEY, data.token)
      set({
        token: data.token,
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Registration failed',
      })
      throw err
    }
  },

  logout: async () => {
    const token = get().token
    if (token) {
      try {
        await authFetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {
        // Logout locally even if server call fails
      }
    }
    localStorage.removeItem(STORAGE_KEY)
    set({ token: null, user: null, isAuthenticated: false })
  },

  loadSession: async () => {
    const token = get().token
    if (!token) {
      set({ isAuthenticated: false })
      return
    }

    try {
      const res = await authFetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        // Token invalid — clear session
        localStorage.removeItem(STORAGE_KEY)
        set({ token: null, user: null, isAuthenticated: false })
        return
      }

      const user = await res.json()
      set({ user, isAuthenticated: true })
    } catch {
      // Network error — keep token, mark as not loaded
      set({ isAuthenticated: false })
    }
  },

  clearError: () => set({ error: null }),
}))
