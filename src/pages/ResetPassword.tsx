import { FormEvent, useMemo, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Eye, EyeOff } from 'lucide-react'
import { api } from '../lib/api'
import { showToast } from '../lib/toast'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = useMemo(() => params.get('token') || '', [params])
  const navigate = useNavigate()

  const [pwd, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState({ p: false, c: false })
  const [loading, setLoading] = useState(false)
  const [invalid, setInvalid] = useState(!token) // if no token in URL, show invalid state
  const [resendOpen, setResendOpen] = useState(false)
  const [resendEmail, setResendEmail] = useState('')
  const [resending, setResending] = useState(false)

  const score = useMemo(() => scorePassword(pwd), [pwd])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (invalid) return
    if (!pwd || !confirm || pwd !== confirm) {
      showToast({ kind: 'error', title: 'Check passwords', message: 'Passwords must match.' })
      return
    }
    setLoading(true)
    try {
      await api.post('/api/user/reset-password', { password: pwd }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showToast({ kind: 'success', title: 'Password reset', message: 'You can now sign in.' })
      navigate('/login', { replace: true })
    } catch (err: any) {
      const msg = err?.response?.data?.message?.toString().toLowerCase() || ''
      if (msg.includes('expired') || msg.includes('invalid') || [400,401,403].includes(err?.response?.status)) {
        setInvalid(true)
      }
      showToast({ kind: 'error', title: 'Unable to reset', message: err?.response?.data?.message || 'The reset link may be invalid or expired.' })
    } finally { setLoading(false) }
  }

  async function onResend(e: FormEvent) {
    e.preventDefault()
    if (!resendEmail.trim()) return
    setResending(true)
    try {
      await api.post('/api/user/forgot-password', { email: resendEmail.trim() })
      // enumeration-safe toast
      showToast({ kind: 'success', title: 'If the email exists…', message: 'We just sent a reset link.' })
      setResendOpen(false)
    } catch {
      // same toast on error
      showToast({ kind: 'success', title: 'If the email exists…', message: 'We just sent a reset link.' })
      setResendOpen(false)
    } finally { setResending(false) }
  }

  return (
    <>
      <div className="max-w-md mx-auto h-screen ">
        <div className="card bg-white">
          <div className="card-header">
            <h2 className="text-lg font-semibold">{invalid ? 'Reset Link Invalid' : 'Reset Password'}</h2>
            <p className="muted">
              {invalid ? 'Your link is invalid or has expired.' : 'Create a new password for your account.'}
            </p>
          </div>

          <div className="card-content">
            {invalid ? (
              <div className="space-y-4">
                {!resendOpen ? (
                  <>
                    <Button onClick={() => setResendOpen(true)}>Resend reset link</Button>
                    <div className="text-right">
                      <Link to="/login" className="text-blue-600 hover:underline text-sm">Back to login</Link>
                    </div>
                  </>
                ) : (
                  <form onSubmit={onResend} className="space-y-4">
                    <div>
                      <label htmlFor="rp-resend-email" className="label">Email</label>
                      <Input
                        id="rp-resend-email"
                        type="email"
                        placeholder="you@example.com"
                        value={resendEmail}
                        onChange={e => setResendEmail(e.target.value)}
                        required
                        aria-required="true"
                        autoComplete="email"
                      />
                    </div>
                    <div className="flex items-center justify-between">
<Button type="button" className="btn-secondary" onClick={() => setResendOpen(false)} disabled={resending}>
  Cancel
</Button>
                      <Button disabled={resending}>{resending ? 'Sending…' : 'Send reset link'}</Button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label htmlFor="rp-password" className="label">New Password</label>
                  <div className="relative">
                    <Input
                      id="rp-password"
                      type={show.p ? 'text' : 'password'}
                      value={pwd}
                      onChange={e => setPwd(e.target.value)}
                      required
                      aria-required="true"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      aria-label={show.p ? 'Hide password' : 'Show password'}
                      onClick={() => setShow(s => ({ ...s, p: !s.p }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-500"
                    >
                      {show.p ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <StrengthMeter score={score} />
                </div>

                <div>
                  <label htmlFor="rp-confirm" className="label">Confirm Password</label>
                  <div className="relative">
                    <Input
                      id="rp-confirm"
                      type={show.c ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                      aria-required="true"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      aria-label={show.c ? 'Hide password' : 'Show password'}
                      onClick={() => setShow(s => ({ ...s, c: !s.c }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-500"
                    >
                      {show.c ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button className="w-full" disabled={loading}>
                  {loading ? 'Resetting…' : 'Reset Password'}
                </Button>

                <div className="text-right">
                  <Link to="/login" className="text-blue-600 hover:underline text-sm">Back to login</Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <UltraLoader show={loading || resending} label={loading ? 'Resetting password…' : resending ? 'Sending reset link…' : ''} />
    </>
  )
}

/* — Strength meter — */
function StrengthMeter({ score }: { score: number }) {
  const labels = ['Very weak', 'Weak', 'Okay', 'Good', 'Strong']
  const tones = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 'bg-emerald-600']
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded ${i <= score ? tones[score] : 'bg-neutral-200'}`} />
        ))}
      </div>
      <div className="mt-1 text-xs text-neutral-600">{labels[score]}</div>
    </div>
  )
}
function scorePassword(pw: string) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[a-z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  // Map 0..5 → 0..4
  return Math.min(4, Math.max(0, s - 1))
}

/* Ultra loader */
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
