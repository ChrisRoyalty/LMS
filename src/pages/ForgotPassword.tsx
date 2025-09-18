import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { showToast } from '../lib/toast'
import { api } from '../lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      await api.post('/api/user/forgot-password', { email: email.trim() })
      // Generic success to prevent email enumeration
      showToast({ kind: 'success', title: 'If the email exists…', message: 'We just sent a reset link.' })
      setDone(true)
    } catch {
      // Same message even on error (enumeration-safe)
      showToast({ kind: 'success', title: 'If the email exists…', message: 'We just sent a reset link.' })
      setDone(true)
    } finally { setLoading(false) }
  }

  return (
    <>
      <div className="max-w-md mx-auto h-screen flex items-center">
        <div className="card bg-white">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Forgot Password</h2>
            <p className="muted">Enter your email to receive a reset link.</p>
          </div>
          <div className="card-content">
            {done ? (
              <div className="space-y-4">
                <p className="text-sm text-neutral-700">
                  If an account exists for <span className="font-medium">{email}</span>, you’ll get an email shortly with a reset link.
                </p>
                <div className="flex items-center justify-between">
                  <Link to="/login" className="text-blue-600 hover:underline text-sm">Back to login</Link>
<Button onClick={() => setDone(false)} className="btn-secondary">Use another email</Button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label htmlFor="fp-email" className="label">Email</label>
                  <Input
                    id="fp-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    aria-required="true"
                    autoComplete="email"
                  />
                </div>
                <Button className="w-full" disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </Button>
                <div className="text-right">
                  <Link to="/login" className="text-blue-600 hover:underline text-sm">Back to login</Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <UltraLoader show={loading} label="Sending reset link…" />
    </>
  )
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
