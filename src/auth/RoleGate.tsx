// src/auth/RoleGate.tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

type Role = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'

export function RoleGate({
  roles,
  children,
}: {
  roles: Role[]
  children: React.ReactNode
}) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) {
    // Not allowed → push them to a role-based chooser
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
