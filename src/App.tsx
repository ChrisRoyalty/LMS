// src/App.tsx
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom'

import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

import AdminLayout from './layouts/AdminLayout'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import Courses from './pages/admin/Courses'
import Students from './pages/admin/Students'
import Instructors from './pages/admin/Instructors'
import Interns from './pages/admin/Interns'
import Settings from './pages/admin/Settings'

import InstructorLayout from './layouts/InstructorLayout'
import { InstructorDashboard } from './pages/instructor/InstructorDashboard'
import InstructorStudents from './pages/instructor/InstructorStudents'
import InstructorAssignments from './pages/instructor/InstructorAssignments'
import InstructorAnalytics from './pages/instructor/InstructorAnalytics'
import InstructorAnnouncements from './pages/instructor/InstructorAnnouncements'

/* ——— NEW: Student layout & pages ——— */
import StudentLayout from './layouts/StudentLayout'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentAnnouncements from './pages/student/StudentAnnouncements'
import StudentAssignments from './pages/student/StudentAssignment'
import StudentCourses from './pages/student/StudentCourses'
// If you add a StudentAnalytics page later, just import and plug in.

import { ProtectedRoute } from './auth/ProtectedRoute'
import { RoleGate } from './auth/RoleGate'
import { useAuth } from './auth/AuthContext'
import StudentGrades from './pages/student/StudentGrades'

export default function App() {
  return (
    <Routes>
      {/* Public pages (no admin layout) */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Reset password supports both query (?token=...) and param (/reset-password/:token) */}
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Route>

      {/* Authenticated app */}
      <Route element={<ProtectedRoute />}>
        {/* Admin area with full layout */}
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
          <Route path="interns" element={<Interns />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Instructor area WITH persistent sidebar/layout */}
        <Route
          path="/instructor/*"
          element={
            <RoleGate roles={['INSTRUCTOR']}>
              <InstructorLayout />
            </RoleGate>
          }
        >
          <Route index element={<InstructorDashboard />} />
          <Route path="students" element={<InstructorStudents />} />
          <Route path="assignments" element={<InstructorAssignments />} />
          <Route path="analytics" element={<InstructorAnalytics />} />
          <Route path="announcements" element={<InstructorAnnouncements />} />
        </Route>

        {/* NEW: Student area WITH persistent sidebar/layout */}
   
<Route
  path="/student/*"
  element={
    <RoleGate roles={['STUDENT']}>
      <StudentLayout />
    </RoleGate>
  }
>
  <Route index element={<StudentDashboard />} />
  <Route path="courses" element={<StudentCourses />} />
  <Route path="assignments" element={<StudentAssignments />} />
  <Route path="grades" element={<StudentGrades />} />
  <Route path="announcements" element={<StudentAnnouncements />} />
</Route>


        {/* Generic role-based landing */}
        <Route path="/dashboard" element={<DashboardChooser />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

/** Public wrapper (light background, no admin chrome) */
function PublicLayout() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Outlet />
    </div>
  )
}

/** Redirect to the correct dashboard for the logged-in user */
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
    <div className="relative min-h-screen overflow-hidden">
      {/* subtle background grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"
      />

      {/* animated blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-20 h-[380px] w-[380px] rounded-full bg-gradient-to-b from-[#0B5CD7] to-[#6aa3ff] blur-3xl opacity-30 animate-pulse"
      />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 py-16 text-center">
        {/* badge */}
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-3 py-1 text-xs text-neutral-600 backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-[#0B5CD7]" />
          404 • Page not found
        </span>

        {/* big headline */}
        <h1 className="bg-gradient-to-br from-neutral-900 to-neutral-600 bg-clip-text text-5xl font-extrabold leading-tight text-transparent sm:text-6xl">
          Oops — this page took a detour
        </h1>

        <p className="mt-4 max-w-xl text-neutral-600">
          The URL you followed doesn’t exist or may have moved. Try going back, or head to a safe place.
        </p>

        {/* actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <GoBackButton />
          <a
            href="/"
            className="inline-flex items-center rounded-xl bg-[#0B5CD7] px-4 py-2 text-white shadow-sm transition hover:brightness-95"
          >
            Go to Login
          </a>
          <a
            href="/dashboard"
            className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-neutral-800 hover:bg-neutral-50"
          >
            Open Dashboard
          </a>
        </div>

        {/* helpful tips */}
        <div className="mt-10 grid w-full gap-3 sm:grid-cols-3">
          <TipCard title="Check the URL" desc="Make sure it’s spelled correctly." />
          <TipCard title="Use the menu" desc="Navigation can guide you there." />
          <TipCard title="Report a link" desc={<a className="underline" href="mailto:support@rad5academy.com">Tell support</a>} />
        </div>
      </div>
    </div>
  )
}

/* tiny components used above */
function GoBackButton() {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(-1)}
      className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-neutral-800 hover:bg-neutral-50"
    >
      Go Back
    </button>
  )
}

function TipCard({ title, desc }: { title: string; desc: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-left">
      <div className="text-sm font-semibold text-neutral-900">{title}</div>
      <div className="mt-1 text-sm text-neutral-600">{desc}</div>
    </div>
  )
}
