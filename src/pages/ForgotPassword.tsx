import { FormEvent, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { api } from '../lib/api'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      await api.post('/auth/forgot-password', { email })
      setStatus('If an account exists for this email, a reset link has been sent.')
    } catch (err: any) {
      setStatus(err?.response?.data?.message || 'Unable to process request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <div className="card-header">
          <h1 className="text-xl font-semibold">Reset password</h1>
        </div>
        <div className="card-content">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <Button disabled={loading} className="w-full">{loading ? 'Submitting…' : 'Send reset link'}</Button>
          </form>
          {status && <p className="mt-3 text-sm">{status}</p>}
        </div>
      </div>
    </div>
  )
}