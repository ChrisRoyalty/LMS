// src/auth/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

export function ProtectedRoute() {
  const { user } = useAuth()
  const location = useLocation()

  // If there's a token but context hasn't hydrated yet, avoid redirect flicker.
  const [checking, setChecking] = useState(false)
  useEffect(() => {
    const hasToken = !!localStorage.getItem('token')
    // If user isn't set yet but we have a token, briefly hold to allow hydration.
    if (!user && hasToken) {
      setChecking(true)
      // microtask tick is enough when AuthContext hydrates synchronously from localStorage
      queueMicrotask(() => setChecking(false))
    }
  }, [user])

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center text-neutral-500">
        Loading…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
