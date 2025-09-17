import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Bell, LayoutDashboard, BookOpen, Users, UserCog, Settings,
  ChevronDown, LogOut, Menu, X, UserSquare2
} from 'lucide-react'
import { LuGraduationCap } from 'react-icons/lu'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../lib/api'
import { AdminDashboardPayload } from '../lib/types'

type NavItem = {
  to: string
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  countKey?: keyof Counts
}
type Counts = {
  courses: number
  students: number
  instructors: number
  interns: number
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const initials = (user?.name || 'Admin User').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()

  const { pathname } = useLocation()
  const title =
    pathname === '/admin' ? 'Admin Dashboard' :
    pathname.startsWith('/admin/courses') ? 'Courses' :
    pathname.startsWith('/admin/students') ? 'Students' :
    pathname.startsWith('/admin/instructors') ? 'Instructors' :
    pathname.startsWith('/admin/interns') ? 'Interns' :
    pathname.startsWith('/admin/settings') ? 'Settings' : 'Admin'

  // dynamic counts from dashboard endpoint
  const [counts, setCounts] = useState<Counts>({ courses: 0, students: 0, instructors: 0, interns: 0 })
  useEffect(() => {
    let mounted = true
    api.get<AdminDashboardPayload>('/api/dashboard/admin-dashboard')
      .then(({ data }) => {
        if (!mounted) return
        const internsFromAPI = (data as any)?.totalInterns as number | undefined
        // fallback: derive interns by role name if backend hasn't added totalInterns yet
        const internsDerived = (data.topCourses || [])
          .flatMap(c => c.students || [])
          .filter(s => (s.role?.name || '').toLowerCase() === 'intern').length
        setCounts({
          courses: data.totalCourses ?? 0,
          students: data.totalStudents ?? 0,
          instructors: data.totalInstructors ?? 0,
          interns: internsFromAPI ?? internsDerived ?? 0,
        })
      })
      .catch(() => {
        if (!mounted) return
        setCounts({ courses: 0, students: 0, instructors: 0, interns: 0 })
      })
    return () => { mounted = false }
  }, [])

  const NAV: NavItem[] = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/courses', label: 'Courses', icon: BookOpen, countKey: 'courses' },
    { to: '/admin/students', label: 'Students', icon: Users, countKey: 'students' },
    { to: '/admin/instructors', label: 'Instructors', icon: UserCog, countKey: 'instructors' },
    { to: '/admin/interns', label: 'Interns', icon: UserSquare2, countKey: 'interns' },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ]

  // User popover
  const [userOpen, setUserOpen] = useState(false)
  const userRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (!userRef.current) return; if (!userRef.current.contains(e.target as Node)) setUserOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  // Mobile drawer
  const [drawer, setDrawer] = useState(false)

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* FIXED SIDEBAR */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-72 flex-col border-r border-neutral-200 bg-white">
        {/* Brand (sticky) */}
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
            const countVal = item.countKey ? counts[item.countKey] : undefined
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm',
                    isActive ? 'bg-[#0B5CD7] text-white' : 'text-neutral-700 hover:bg-neutral-50'
                  ].join(' ')
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {typeof countVal === 'number' && (
                  <span className="ml-auto inline-flex items-center rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-xs text-neutral-700">
                    {countVal}
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
              {initials[0]}
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium">{user?.name || 'Admin User'}</div>
              <div>
                <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs text-red-600">Admin</span>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-neutral-500" />
          </button>

          {userOpen && (
            <div className="absolute bottom-16 left-3 w-64 rounded-xl border border-neutral-200 bg-white shadow-lg">
              <div className="p-3">
                <div className="text-xs text-neutral-500 mb-1">Signed in as</div>
                <div className="font-medium">{user?.name || 'Admin User'}</div>
              </div>
              <div className="h-px bg-neutral-200" />
              <button className="w-full flex items-center gap-2 p-3 text-left text-red-600 hover:bg-red-50" onClick={logout}>
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN (pushed by fixed sidebar on md+) */}
      <div className="md:pl-72">
        {/* STICKY HEADER */}
        <header className="bg-white border-b border-neutral-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3">
          <button className="md:hidden rounded-md p-2 hover:bg-neutral-100" onClick={() => setDrawer(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
            <p className="text-sm text-neutral-500 -mt-0.5">Welcome back, {user?.name || 'Admin User'}!</p>
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
                const countVal = item.countKey ? counts[item.countKey] : undefined
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/admin'}
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
                    {typeof countVal === 'number' && (
                      <span className="ml-auto inline-flex items-center rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-xs text-neutral-700">
                        {countVal}
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
