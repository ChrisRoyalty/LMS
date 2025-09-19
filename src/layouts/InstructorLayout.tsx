// src/layouts/InstructorLayout.tsx
import { NavLink, Outlet } from 'react-router-dom'
import { Bell, LayoutDashboard, Users, Notebook, BarChart3, Megaphone, LogOut, Menu, X, ChevronDown } from 'lucide-react'
import { LuGraduationCap } from 'react-icons/lu'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'

type NavItem = {
  to: string
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  count?: number
}

export default function InstructorLayout() {
  const { user, logout } = useAuth()
  const displayName = user?.name || (user as any)?.fullName || 'John Smith'
  const initials = displayName.split(' ').map((s: any[]) => s[0]).slice(0, 2).join('').toUpperCase()

  const NAV: NavItem[] = [
    { to: '/instructor', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/instructor/students', label: 'Students', icon: Users, count: 4 },
    { to: '/instructor/assignments', label: 'Assignments', icon: Notebook, count: 3 },
    { to: '/instructor/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/instructor/announcements', label: 'Announcements', icon: Megaphone },
  ]

  // user popover
  const [userOpen, setUserOpen] = useState(false)
  const userRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (!userRef.current) return; if (!userRef.current.contains(e.target as Node)) setUserOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  // mobile drawer
  const [drawer, setDrawer] = useState(false)

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* FIXED SIDEBAR (desktop) */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-72 flex-col border-r border-neutral-200 bg-white">
        {/* Brand */}
        <div className="sticky top-0 z-10 flex items-center gap-3 px-5 py-4 border-b border-neutral-200 bg-white">
          <div className="h-10 w-10 rounded-full bg-[#0B5CD7] grid place-items-center">
            <LuGraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-semibold leading-tight">RAD5 Academy</div>
            <div className="text-xs text-neutral-500 leading-tight">Learning Management System</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-3 space-y-1 overflow-y-auto">
          {NAV.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/instructor'}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm',
                    isActive ? 'bg-[#0B5CD7] text-white' : 'text-neutral-700 hover:bg-neutral-50'
                  ].join(' ')
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {typeof item.count === 'number' && (
                  <span className="ml-auto inline-flex items-center rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-xs text-neutral-700">
                    {item.count}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="mt-auto p-3 border-t border-neutral-200 relative" ref={userRef}>
          <button className="w-full flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-neutral-50" onClick={() => setUserOpen(o => !o)}>
            <div className="h-9 w-9 rounded-full bg-neutral-200 grid place-items-center text-neutral-700 font-medium">
              {initials}
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium">{displayName}</div>
              <div>
                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">Instructor</span>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-neutral-500" />
          </button>

          {userOpen && (
            <div className="absolute bottom-16 left-3 w-64 rounded-xl border border-neutral-200 bg-white shadow-lg">
              <div className="p-3">
                <div className="text-xs text-neutral-500 mb-1">Signed in as</div>
                <div className="font-medium">{displayName}</div>
              </div>
              <div className="h-px bg-neutral-200" />
              <button className="w-full flex items-center gap-2 p-3 text-left text-red-600 hover:bg-red-50" onClick={logout}>
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* CONTENT (pushed on md+) */}
      <div className="md:pl-72">
        {/* STATIC HEADER (same on every instructor route) */}
        <header className="bg-white border-b border-neutral-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3">
          <button className="md:hidden rounded-md p-2 hover:bg-neutral-100" onClick={() => setDrawer(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>

          <div>
            <h1 className="text-lg font-semibold text-neutral-900">Instructor Dashboard</h1>
            <p className="text-sm text-neutral-500 -mt-0.5">Welcome back, {displayName}!</p>
          </div>

          <button className="relative rounded-full p-2 hover:bg-neutral-100" aria-label="Notifications">
            <Bell className="h-5 w-5 text-neutral-900" />
            <span className="absolute -right-1 -top-1 rounded-full bg-[#FF6A3D] text-white text-[10px] font-semibold px-1.5 py-0.5 leading-none">3</span>
          </button>
        </header>

        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* MOBILE DRAWER */}
      {drawer && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setDrawer(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-neutral-200 flex flex-col">
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-neutral-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#0B5CD7] grid place-items-center">
                  <LuGraduationCap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold leading-tight">RAD5 Academy</div>
                  <div className="text-xs text-neutral-500 leading-tight">Learning Management System</div>
                </div>
              </div>
              <button className="rounded-md p-2 hover:bg-neutral-100" onClick={() => setDrawer(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="p-3 space-y-1 overflow-y-auto">
              {NAV.map(item => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/instructor'}
                    onClick={() => setDrawer(false)}
                    className={({ isActive }) =>
                      [
                        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm',
                        isActive ? 'bg-[#0B5CD7] text-white' : 'text-neutral-700 hover:bg-neutral-50'
                      ].join(' ')
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {typeof item.count === 'number' && (
                      <span className="ml-auto inline-flex items-center rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-xs text-neutral-700">
                        {item.count}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </nav>

            <div className="mt-auto p-3 border-t border-neutral-200">
              <button className="w-full flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-neutral-50 text-red-600" onClick={logout}>
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
