// src/App.tsx
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import AdminLayout from './layouts/AdminLayout'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import Courses from './pages/admin/Courses'
import Students from './pages/admin/Students'
import Instructors from './pages/admin/Instructors'
import Settings from './pages/admin/Settings'
import { InstructorDashboard } from './pages/instructor/InstructorDashboard'
import { StudentDashboard } from './pages/student/StudentDashboard'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { RoleGate } from './auth/RoleGate'
import { useAuth } from './auth/AuthContext'
import Interns from './pages/admin/Interns'
import ResetPassword from './pages/ResetPassword'

export default function App() {
  return (
    <Routes>
      {/* Public pages use their own lightweight frame */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

      </Route>

      {/* Private app */}
      <Route element={<ProtectedRoute />}>
        {/* Admin area (full layout) */}
        <Route
          path="/admin/*"
          element={
            <RoleGate roles={['ADMIN']}>
              <AdminLayout />
            </RoleGate>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="courses" element={<Courses />} />
          <Route path="students" element={<Students />} />
          <Route path="instructors" element={<Instructors />} />
          <Route path="interns" element={<Interns />} /> {/* <-- moved inside admin */}
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Instructor & Student single-page dashboards */}
        <Route
          path="/instructor"
          element={
            <RoleGate roles={['INSTRUCTOR']}>
              <InstructorDashboard />
            </RoleGate>
          }
        />
        <Route
          path="/student"
          element={
            <RoleGate roles={['STUDENT']}>
              <StudentDashboard />
            </RoleGate>
          }
        />

        {/* Role-based redirect */}
        <Route path="/dashboard" element={<DashboardChooser />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

/** Public pages frame (no global header/container on admin) */
function PublicLayout() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Outlet />
    </div>
  )
}

function DashboardChooser() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
  if (user.role === 'INSTRUCTOR') return <Navigate to="/instructor" replace />
  if (user.role === 'STUDENT') return <Navigate to="/student" replace />
  return <Navigate to="/login" replace />
}

function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="card max-w-lg">
        <div className="card-header">
          <h1 className="text-lg font-semibold">Not found</h1>
        </div>
        <div className="card-content">
          <p className="muted">The page you’re looking for doesn’t exist.</p>
        </div>
      </div>
    </div>
  )
}
