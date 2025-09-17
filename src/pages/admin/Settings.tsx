// src/pages/admin/Settings.tsx
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Eye, EyeOff, Plus, X } from 'lucide-react'
import { api } from '../../lib/api'
import { showToast } from '../../lib/toast'

export default function Settings() {
  // Profile (endpoint not ready yet — show info toast on click)
  const [firstName, setFirstName] = useState('Admin')
  const [lastName, setLastName] = useState('User')
  const [email, setEmail] = useState('admin@rad5academy.com')

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [show, setShow] = useState({ current: false, next: false, confirm: false })
  const [changing, setChanging] = useState(false)

  // Roles
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([])
  const [rolesLoading, setRolesLoading] = useState(true)
  const [roleModal, setRoleModal] = useState(false)
  const [roleName, setRoleName] = useState('')
  const [roleSaving, setRoleSaving] = useState(false)

  // Batches
  const [batches, setBatches] = useState<Array<{ id: string; name: string }>>([])
  const [batchesLoading, setBatchesLoading] = useState(true)
  const [batchModal, setBatchModal] = useState(false)
  const [batchName, setBatchName] = useState('')
  const [batchSaving, setBatchSaving] = useState(false)

  // Create Admin
  const [adminModal, setAdminModal] = useState(false)
  const [adminFullName, setAdminFullName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminRoleId, setAdminRoleId] = useState<string>('')
  const [adminSaving, setAdminSaving] = useState(false)

  useEffect(() => {
    void loadRoles()
    void loadBatches()
  }, [])

  useEffect(() => {
    // Preselect "admin" role id (when roles load)
    const admin = roles.find(r => r.name?.toLowerCase() === 'admin')
    if (admin && !adminRoleId) setAdminRoleId(admin.id)
  }, [roles]) // eslint-disable-line

  async function loadRoles() {
    setRolesLoading(true)
    try {
      const { data } = await api.get('/api/admin/roles')
      setRoles(Array.isArray(data) ? data : [])
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

  // Change Password
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

  // Create Role
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

  // Create Batch (supports both /admin/create-batch and /api/admin/create-batch)
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

  // Create Admin (register-user)
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

  function handleProfileUpdate() {
    showToast({ kind: 'info', title: 'Coming soon', message: 'Profile update endpoint is not yet available.' })
  }

  return (
    <div className="space-y-4">
     <div>
       <h1 className="text-2xl font-semibold ">Settings</h1>
      <p className='mb-4'>Manage your account and system settings</p>
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
          <Button className="mt-4" onClick={handleProfileUpdate}>Update Profile</Button>
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
            {changing ? 'Changing…' : 'Change Password'}
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
  )
}

/* Modal + small utils */
function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose} />
      <div className="fixed inset-0 z-50 grid place-items-center px-4">
        <div className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white shadow-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button className="rounded-md p-2 hover:bg-neutral-100" onClick={onClose} aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </>
  )
}
function titleCase(s: string) { return s.replace(/\b\w/g, m => m.toUpperCase()) }
