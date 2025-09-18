// src/pages/Login.tsx
import { FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, type Role } from '../auth/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Eye, EyeOff, ChevronDown, Check } from 'lucide-react'
import { LuGraduationCap } from 'react-icons/lu'
import { showToast } from '../lib/toast'

/** Brand icon using react-icons */
function Brand() {
  return (
    <div className="h-16 w-16 rounded-full bg-[#0B5CD7] grid place-items-center">
      <LuGraduationCap className="h-10 w-8 text-white" />
    </div>
  )
}

/** Headless select to match the Figma dropdown look */
function RoleSelect({ value, onChange }: { value: Role; onChange: (v: Role) => void }) {
  const options: { value: Role; label: string }[] = [
    { value: 'ADMIN', label: 'Administrator' },
    { value: 'INSTRUCTOR', label: 'Instructor' },
    { value: 'STUDENT', label: 'Student' },
  ]
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(Math.max(0, options.findIndex(o => o.value === value)))
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    setActive(Math.max(0, options.findIndex(o => o.value === value)))
  }, [value])

  const selected = options.find(o => o.value === value)

  return (
    <div className="relative bg-[#f4f5f7]" ref={ref}>
      <button
        type="button"
        className="input w-full text-left pr-10"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        {selected ? selected.label : <span className="text-neutral-400">Select…</span>}
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-2 z-20 rounded-xl border border-neutral-200 bg-white shadow-lg overflow-hidden">
          <ul role="listbox" className="py-1 max-h-60 overflow-auto">
            {options.map((opt, idx) => {
              const isSel = opt.value === value
              const isAct = idx === active
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSel}
                  onMouseEnter={() => setActive(idx)}
                  onMouseDown={(e) => { e.preventDefault(); onChange(opt.value); setOpen(false) }}
                  className={[
                    'px-3 py-2 cursor-pointer flex items-center justify-between',
                    isAct ? 'bg-cyan-500 text-white' : 'hover:bg-neutral-50',
                    isSel && !isAct ? 'text-neutral-900' : ''
                  ].join(' ')}
                >
                  <span>{opt.label}</span>
                  {isSel && <Check className="h-4 w-4 opacity-90" />}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function Login() {
  const { login, user } = useAuth()
  const [role, setRole] = useState<Role>('ADMIN')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname as string | undefined

  const landingFor = (r?: Role) =>
    r === 'INSTRUCTOR' ? '/instructor' :
    r === 'STUDENT'    ? '/student'    : '/admin'

  // Already logged in? bounce out (AuthContext hydrates from localStorage)
  useEffect(() => {
    if (user) navigate(landingFor(user.role), { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(email, password)

      // Pull fresh user for toast context (AuthContext stores it & localStorage mirrors it)
      const stored = localStorage.getItem('user')
      const parsed = stored ? JSON.parse(stored) as { name?: string; role?: Role } : undefined
      const firstName = (parsed?.name || email).split(' ')[0]
      const r = parsed?.role || role

      // Success toast
      showToast({
        kind: 'success',
        title: 'Signed in',
        message: `Welcome back, ${firstName}!`,
      })

      // Navigate to original protected page OR role landing
      navigate(from || landingFor(r), { replace: true })
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Login failed'
      setError(msg)
      // Error toast
      showToast({
        kind: 'error',
        title: 'Login failed',
        message: msg,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Brand */}
      <div className="flex flex-col items-center mb-6 mt-8">
        <Brand />
        <h1 className="mt-3 text-2xl font-semibold text-neutral-900">RAD5 Academy</h1>
        <p className="text-neutral-500">Learning Management System</p>
      </div>

      {/* Card */}
      <div className="card bg-white">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Sign In</h2>
          <p className="muted">Enter your credentials to access the LMS</p>
        </div>
        <div className="card-content">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label">Role</label>
              <RoleSelect value={role} onChange={setRole} />
            </div>

            <div>
              <label className="label">Email</label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-500"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <Button disabled={loading} className="w-full">
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-sm flex justify-end">
            <Link to="/forgot-password" className="text-blue-600 hover:underline">Forgot password?</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
