import React, { createContext, useContext, useMemo, useState } from 'react'
import { api, setAuthToken } from '../lib/api'

export type Role = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'
type User = { id: string; email: string; name: string; role: Role }

type Ctx = {
  /** ready is always true because we hydrate synchronously */
  ready: boolean
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<Ctx | undefined>(undefined)

/** Synchronous localStorage read to avoid redirect flicker on refresh */
function getInitialUser(): User | null {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    return JSON.parse(raw) as User
  } catch { return null }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getInitialUser())

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/api/user/login', { email, password })
    // 1) set token immediately for axios + persist
    setAuthToken(data?.token)

    // 2) normalize role
    const roleName: string = (data?.user?.role?.name || 'admin').toString().toUpperCase()
    const mappedRole: Role =
      roleName === 'INSTRUCTOR' ? 'INSTRUCTOR' :
      roleName === 'STUDENT'    ? 'STUDENT'    : 'ADMIN'

    // 3) persist user
    const u: User = { id: data.user.id, email: data.user.email, name: data.user.fullName, role: mappedRole }
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
  }

  const logout = () => {
    setAuthToken(null)
    localStorage.removeItem('user')
    setUser(null)
  }

  const value = useMemo(() => ({ ready: true, user, login, logout }), [user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
