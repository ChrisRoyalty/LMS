// src/pages/Login.tsx
import { FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, type Role } from '../auth/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Eye, EyeOff } from 'lucide-react'
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

export default function Login() {
  const { login, user } = useAuth()
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

      // Pull fresh user for toast/redirect context (AuthContext stores it & localStorage mirrors it)
      const stored = localStorage.getItem('user')
      const parsed = stored ? (JSON.parse(stored) as { name?: string; role?: Role }) : undefined
      const firstName = (parsed?.name || email).split(' ')[0]
      const r: Role | undefined = parsed?.role || user?.role

      // Success toast
      showToast({
        kind: 'success',
        title: 'Signed in',
        message: `Welcome back, ${firstName}!`,
      })

      // Navigate to original protected page OR role landing (fallback to root if role missing)
      const dest = from || (r ? landingFor(r) : '/')
      navigate(dest, { replace: true })
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Login failed'
      setError(msg)
      showToast({ kind: 'error', title: 'Login failed', message: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="max-w-md max-sm:mx-4 mx-auto ">
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
                <label className="label">Email</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
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
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-500"
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
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

      {/* Ultra loader overlay (shared look) */}
      <UltraLoader show={loading} label="Signing you in…" />
    </>
  )
}

/* — Ultra loader (same across app) — */
function UltraLoader({ show, label = '' }: { show: boolean; label?: string }) {
  if (!show) return null
  return (
    <div aria-busy="true" role="status" className="fixed inset-0 z-[9999] grid place-items-center bg-black/20 backdrop-blur-sm">
      <div className="rounded-2xl border border-neutral-200 bg-white/90 px-6 py-5 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="relative h-10 w-10">
            <span className="absolute inset-0 rounded-full border-4 border-neutral-200" />
            <span className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#0B5CD7] animate-spin" />
          </div>
          <div className="min-w-[180px]">
            <div className="text-sm font-medium text-neutral-900">{label || 'Please wait…'}</div>
            <div className="mt-2 flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#0B5CD7] [animation-delay:-.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#0B5CD7] [animation-delay:-.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#0B5CD7]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
