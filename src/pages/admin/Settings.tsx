// src/pages/admin/Settings.tsx
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Eye, EyeOff, Plus, X } from 'lucide-react'
import { api } from '../../lib/api'
import { showToast } from '../../lib/toast'
import { createPortal } from 'react-dom'

type Role = { id: string; name: string }
type Batch = { id: string; name: string }
type AuthUser = {
  id: string
  fullName?: string
  email?: string
  roleId?: string
  role?: { id: string; name: string }
}

/* — session helpers — */
function readAuthUser(): AuthUser | null {
  const keys = ['auth', 'user', 'currentUser']
  for (const k of keys) {
    const raw = localStorage.getItem(k)
    if (!raw) continue
    try {
      const obj = JSON.parse(raw)
      if (obj?.user?.id) return obj.user
      if (obj?.id) return obj as AuthUser
    } catch {}
  }
  return null
}

export default function Settings() {
  /* — profile form — */
  const [firstName, setFirstName] = useState('Admin')
  const [lastName, setLastName] = useState('User')
  const [email, setEmail] = useState('admin@rad5academy.com')

  /* — password — */
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [show, setShow] = useState({ current: false, next: false, confirm: false })
  const [changing, setChanging] = useState(false)

  /* — roles/batches/admin — */
  const [roles, setRoles] = useState<Role[]>([])
  const [rolesLoading, setRolesLoading] = useState(true)
  const [roleModal, setRoleModal] = useState(false)
  const [roleName, setRoleName] = useState('')
  const [roleSaving, setRoleSaving] = useState(false)

  const [batches, setBatches] = useState<Batch[]>([])
  const [batchesLoading, setBatchesLoading] = useState(true)
  const [batchModal, setBatchModal] = useState(false)
  const [batchName, setBatchName] = useState('')
  const [batchSaving, setBatchSaving] = useState(false)

  const [adminModal, setAdminModal] = useState(false)
  const [adminFullName, setAdminFullName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminRoleId, setAdminRoleId] = useState<string>('')
  const [adminSaving, setAdminSaving] = useState(false)

  /* — resolve logged-in user & prefill — */
  const sessionUser = useMemo(() => readAuthUser(), [])
  const CURRENT_USER_ID = sessionUser?.id || ''

  useEffect(() => {
    if (sessionUser?.fullName) {
      const parts = sessionUser.fullName.split(' ')
      const fn = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0]
      const ln = parts.length > 1 ? parts.slice(-1).join(' ') : ''
      setFirstName(fn || firstName)
      setLastName(ln || lastName)
    }
    if (sessionUser?.email) setEmail(sessionUser.email)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* — load selects — */
  useEffect(() => { void loadRoles(); void loadBatches() }, [])
  async function loadRoles() {
    setRolesLoading(true)
    try {
      const { data } = await api.get('/api/admin/roles')
      const list: Role[] = Array.isArray(data) ? data : []
      setRoles(list)
      // preselect admin for Create Admin form
      const admin = list.find(r => (r.name || '').toLowerCase() === 'admin')
      if (admin && !adminRoleId) setAdminRoleId(admin.id)
    } catch (e: any) {
      showToast({ kind: 'error', title: 'Could not load roles', message: e?.response?.data?.message || 'Please try again.' })
    } finally { setRolesLoading(false) }
  }
  async function loadBatches() {
    setBatchesLoading(true)
    try {
      const { data } = await api.get('/api/admin/batches')
      setBatches(Array.isArray(data) ? data : [])
    } catch (e: any) {
      showToast({ kind: 'error', title: 'Could not load batches', message: e?.response?.data?.message || 'Please try again.' })
    } finally { setBatchesLoading(false) }
  }

  /* — resolved admin role id (fallback to provided sample) — */
  const ADMIN_ROLE_ID_FALLBACK = '15a1fa78-2cab-4a0b-b1ce-832d9cee8d64'
  const adminRoleIdResolved =
    roles.find(r => (r.name || '').toLowerCase() === 'admin')?.id || ADMIN_ROLE_ID_FALLBACK

  /* — profile update using dynamic user id + admin role id — */
  async function handleProfileUpdate() {
    const fullName = `${firstName} ${lastName}`.trim()
    if (!CURRENT_USER_ID) {
      showToast({ kind: 'error', title: 'No logged-in user', message: 'Could not detect the current user ID from session.' })
      return
    }
    if (!fullName || !email) {
      showToast({ kind: 'warning', title: 'Missing fields', message: 'Provide full name and email.' })
      return
    }
    setChanging(true)
    try {
      await api.put(`/api/user/edit-user/${CURRENT_USER_ID}`, {
        fullName,
        email,
        roleId: adminRoleIdResolved,
      })
      showToast({ kind: 'success', title: 'Profile updated', message: 'User updated successfully.' })
    } catch (e: any) {
      showToast({ kind: 'error', title: 'Update failed', message: e?.response?.data?.message || 'Please try again.' })
    } finally { setChanging(false) }
  }

  /* — password change — */
  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast({ kind: 'warning', title: 'Missing fields', message: 'Fill all password fields.' }); return
    }
    if (newPassword !== confirmPassword) {
      showToast({ kind: 'error', title: 'Passwords do not match', message: 'Confirm your new password.' }); return
    }
    setChanging(true)
    try {
      await api.post('/api/user/change-password', { currentPassword, newPassword, confirmPassword })
      showToast({ kind: 'success', title: 'Password changed', message: 'Password changed successfully.' })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setShow({ current: false, next: false, confirm: false })
    } catch (e: any) {
      showToast({ kind: 'error', title: 'Change failed', message: e?.response?.data?.message || 'Please try again.' })
    } finally { setChanging(false) }
  }

  /* — create role — */
  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault()
    if (!roleName.trim()) return
    setRoleSaving(true)
    try {
      await api.post('/api/admin/create-roles', { name: roleName.trim().toLowerCase() })
      showToast({ kind: 'success', title: 'Role created', message: roleName })
      setRoleName(''); setRoleModal(false); await loadRoles()
    } catch (e: any) {
      showToast({ kind: 'error', title: 'Create role failed', message: e?.response?.data?.message || 'Please try again.' })
    } finally { setRoleSaving(false) }
  }

  /* — create batch — */
  async function handleCreateBatch(e: React.FormEvent) {
    e.preventDefault()
    if (!batchName.trim()) return
    setBatchSaving(true)
    try {
      try { await api.post('/admin/create-batch', { name: batchName.trim() }) }
      catch (err: any) {
        if (err?.response?.status === 404) await api.post('/api/admin/create-batch', { name: batchName.trim() })
        else throw err
      }
      showToast({ kind: 'success', title: 'Batch created', message: batchName })
      setBatchName(''); setBatchModal(false); await loadBatches()
    } catch (e: any) {
      showToast({ kind: 'error', title: 'Create batch failed', message: e?.response?.data?.message || 'Please try again.' })
    } finally { setBatchSaving(false) }
  }

  /* — create admin — */
  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault()
    if (!adminFullName.trim() || !adminEmail.trim() || !adminRoleId) {
      showToast({ kind: 'warning', title: 'Missing fields', message: 'Provide name, email and role.' }); return
    }
    setAdminSaving(true)
    try {
      await api.post('/api/user/register-user', {
        fullName: adminFullName.trim(),
        email: adminEmail.trim(),
        roleId: adminRoleId,
      })
      showToast({ kind: 'success', title: 'Admin created', message: adminFullName })
      setAdminFullName(''); setAdminEmail(''); setAdminModal(false)
    } catch (e: any) {
      showToast({ kind: 'error', title: 'Create admin failed', message: e?.response?.data?.message || 'Please try again.' })
    } finally { setAdminSaving(false) }
  }

  /* — lock scroll when any modal is open — */
  const anyModalOpen = roleModal || batchModal || adminModal
  useEffect(() => {
    if (anyModalOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [anyModalOpen])

  /* — ultra loader label — */
  const ultraBusy = changing || roleSaving || batchSaving || adminSaving || rolesLoading || batchesLoading
  const ultraLabel =
    changing && currentPassword ? 'Changing password…' :
    changing ? 'Updating profile…' :
    roleSaving ? 'Creating role…' :
    batchSaving ? 'Creating batch…' :
    adminSaving ? 'Creating admin…' :
    rolesLoading || batchesLoading ? 'Loading settings…' : ''

  return (
    <>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="mb-4 text-neutral-600">Manage your account and system settings</p>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader><h2 className="font-medium">Profile Settings</h2></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <label className="label">Last Name</label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <Button className="mt-4" onClick={handleProfileUpdate} disabled={changing}>
              {changing && !currentPassword ? 'Updating…' : 'Update Profile'}
            </Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader><h2 className="font-medium">Change Password</h2></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Current Password</label>
                <div className="relative">
                  <Input type={show.current ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  <button type="button" onClick={() => setShow(s => ({...s, current: !s.current}))} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-500">
                    {show.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <Input type={show.next ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <button type="button" onClick={() => setShow(s => ({...s, next: !s.next}))} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-500">
                    {show.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <div className="relative">
                  <Input type={show.confirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  <button type="button" onClick={() => setShow(s => ({...s, confirm: !s.confirm}))} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-500">
                    {show.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <Button className="mt-4" onClick={handleChangePassword} disabled={changing}>
              {changing && !!currentPassword ? 'Changing…' : 'Change Password'}
            </Button>
          </CardContent>
        </Card>

        {/* Create Admin */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-medium">Administrators</h2>
            <Button onClick={() => setAdminModal(true)} className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Admin
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-600">Create new admin accounts with email invitation.</p>
          </CardContent>
        </Card>

        {/* Role Management */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-medium">Role Management</h2>
            <Button onClick={() => setRoleModal(true)} className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Role
            </Button>
          </CardHeader>
          <CardContent>
            {rolesLoading ? (
              <p className="text-sm text-neutral-500">Loading roles…</p>
            ) : roles.length === 0 ? (
              <p className="text-sm text-neutral-500">No roles yet.</p>
            ) : (
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {roles.map(r => (
                  <li key={r.id} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm">
                    <span className="font-medium text-neutral-900">{titleCase(r.name)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Batch Management */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-medium">Batch Management</h2>
            <Button onClick={() => setBatchModal(true)} className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Batch
            </Button>
          </CardHeader>
          <CardContent>
            {batchesLoading ? (
              <p className="text-sm text-neutral-500">Loading batches…</p>
            ) : batches.length === 0 ? (
              <p className="text-sm text-neutral-500">No batches yet.</p>
            ) : (
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {batches.map(b => (
                  <li key={b.id} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm">
                    <span className="font-medium text-neutral-900">{b.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        {roleModal && (
          <Modal onClose={() => !roleSaving && setRoleModal(false)} title="Create Role">
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="label">Role name</label>
                <Input placeholder="e.g., instructor" value={roleName} onChange={(e) => setRoleName(e.target.value)} required />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setRoleModal(false)} disabled={roleSaving}>Cancel</button>
                <button type="submit" className="btn-primary rounded-lg p-2" disabled={roleSaving}>{roleSaving ? 'Creating…' : 'Create Role'}</button>
              </div>
            </form>
          </Modal>
        )}

        {batchModal && (
          <Modal onClose={() => !batchSaving && setBatchModal(false)} title="Create Batch">
            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="label">Batch name</label>
                <Input placeholder="e.g., Batch A 2025" value={batchName} onChange={(e) => setBatchName(e.target.value)} required />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setBatchModal(false)} disabled={batchSaving}>Cancel</button>
                <button type="submit" className="btn-primary rounded-lg p-2" disabled={batchSaving}>{batchSaving ? 'Creating…' : 'Create Batch'}</button>
              </div>
            </form>
          </Modal>
        )}

        {adminModal && (
          <Modal onClose={() => !adminSaving && setAdminModal(false)} title="Create Admin">
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="label">Full name</label>
                <Input placeholder="e.g., Prince Bassey" value={adminFullName} onChange={(e) => setAdminFullName(e.target.value)} required />
              </div>
              <div>
                <label className="label">Email</label>
                <Input type="email" placeholder="admin@example.com" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={adminRoleId} onChange={(e) => setAdminRoleId(e.target.value)} required>
                  <option value="" disabled>Select role</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{titleCase(r.name)}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setAdminModal(false)} disabled={adminSaving}>Cancel</button>
                <button type="submit" className="btn-primary rounded-lg p-2" disabled={adminSaving}>{adminSaving ? 'Creating…' : 'Create Admin'}</button>
              </div>
            </form>
          </Modal>
        )}
      </div>

      {/* Ultra loader (shared look) */}
      <UltraLoader show={ultraBusy} label={ultraLabel} />
    </>
  )
}

/* — Modal (portal; full-viewport blurred backdrop) — */
function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  const el = useMemo(() => {
    const d = document.createElement('div')
    d.setAttribute('data-modal-root', 'true')
    return d
  }, [])
  useEffect(() => {
    document.body.appendChild(el)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      try { document.body.removeChild(el) } catch {}
    }
  }, [el, onClose])

  const node = (
    <>
      <div className="fixed inset-0 z-[10000] h-screen w-screen bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 z-[10001] grid place-items-center px-4" onClick={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
            <h3 id="modal-title" className="text-lg font-semibold">{title}</h3>
            <button className="rounded-md p-2 hover:bg-neutral-100" onClick={onClose} aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-5 overflow-visible">{children}</div>
        </div>
      </div>
    </>
  )
  return createPortal(node, el)
}

/* — Ultra loader (shared look) — */
function UltraLoader({ show, label = '' }: { show: boolean; label?: string }) {
  if (!show) return null
  return (
    <div aria-busy="true" role="status" className="fixed inset-0 z-[9999] grid place-items-center bg-black/20 backdrop-blur-sm">
      <div className="rounded-2xl border border-neutral-200 bg-white/90 px-6 py-5 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="relative h-10 w-10">
            <span className="absolute inset-0 rounded-full border-4 border-neutral-200" />
            <span className="absolute inset-0 rounded-full border-4 border-transparent border-top-[#0B5CD7]" />
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

/* — utils — */
function titleCase(s: string) { return s.replace(/\b\w/g, m => m.toUpperCase()) }
