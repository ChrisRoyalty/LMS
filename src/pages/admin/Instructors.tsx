// src/pages/admin/Instructors.tsx
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Search, SquarePen, Trash2, Plus, X, ChevronDown, Check, Mail } from 'lucide-react'
import { api } from '../../lib/api'
import { showToast } from '../../lib/toast'

type ApiUser = {
  id: string
  fullName: string
  email: string
  expertise?: string | null
  joinedAt?: string
  status?: string
  course?: { id: string; title: string } | null
  courses?: { id: string; title: string }[]
  role?: { id: string; name: string } | null
}

type Row = {
  id: string
  name: string
  email: string
  expertise: string
  courseTitles: string[]
  courseId?: string
  roleId?: string
  joinDate: string
  status: 'Active' | 'Inactive' | 'Pending' | 'Unknown'
}

type Course = { id: string; title: string }
type Role = { id: string; name: string }

export default function Instructors() {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<Row[]>([])

  const [courses, setCourses] = useState<Course[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const instructorRoleId = useMemo(
    () => roles.find(r => r.name?.toLowerCase() === 'instructor')?.id || '',
    [roles]
  )

  // Create modal
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [cName, setCName] = useState('')
  const [cEmail, setCEmail] = useState('')
  const [cExpertise, setCExpertise] = useState('')
  const [cCourseId, setCCourseId] = useState('')

  // Edit modal
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editRow, setEditRow] = useState<Row | null>(null)
  const [eName, setEName] = useState('')
  const [eEmail, setEEmail] = useState('')
  const [eExpertise, setEExpertise] = useState('')
  const [eCourseId, setECourseId] = useState('')
  const [eRoleId, setERoleId] = useState('')

  // Delete confirm
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { void preload() }, [])

  async function preload() {
    setLoading(true)
    try {
      const [usersRes, coursesRes, rolesRes] = await Promise.all([
        api.get('/api/user/users', { params: { page: 1, limit: 1000 } }),
        api.get('/api/courses/all-courses'),
        api.get('/api/admin/roles'),
      ])

      setCourses((Array.isArray(coursesRes.data) ? coursesRes.data : []).map((x: any) => ({ id: x.id, title: x.title })))
      setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : [])

      const users: ApiUser[] = Array.isArray(usersRes.data?.data) ? usersRes.data.data : []
      const instructors = users.filter(u => (u.role?.name || '').toLowerCase() === 'instructor')

      const mapped: Row[] = instructors.map(u => {
        const titles =
          Array.isArray(u.courses) && u.courses.length
            ? u.courses.map(c => c.title).filter(Boolean)
            : u.course?.title ? [u.course.title] : []
        return {
          id: u.id,
          name: u.fullName,
          email: u.email,
          expertise: u.expertise || '',
          courseTitles: titles,
          courseId: u.course?.id,
          roleId: u.role?.id,
          joinDate: formatDate(u.joinedAt),
          status: mapStatus(u.status),
        }
      })
      setRows(mapped)
    } catch (e: any) {
      showToast({ kind: 'error', title: 'Could not load instructors', message: e?.response?.data?.message || 'Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter(r =>
      r.name.toLowerCase().includes(s) ||
      r.email.toLowerCase().includes(s) ||
      r.expertise.toLowerCase().includes(s) ||
      r.courseTitles.some(c => c.toLowerCase().includes(s)) ||
      r.status.toLowerCase().includes(s)
    )
  }, [q, rows])

  /* ---------- Create ---------- */
  function openCreate() {
    setCName(''); setCEmail(''); setCExpertise(''); setCCourseId('')
    setCreateOpen(true)
  }
  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!instructorRoleId) {
      showToast({ kind: 'error', title: 'Missing role', message: 'Instructor role not found. Please configure roles first.' })
      return
    }
    setCreating(true)
    try {
      const body = {
        fullName: cName,
        email: cEmail,
        expertise: cExpertise || undefined,
        roleId: instructorRoleId,
        courseId: cCourseId || undefined,
      }
      const { data } = await api.post('/api/user/register-user', body)
      showToast({ kind: 'success', title: 'Instructor created', message: data?.message || 'User created' })
      setCreateOpen(false)
      await preload()
    } catch (err: any) {
      showToast({ kind: 'error', title: 'Create failed', message: err?.response?.data?.message || 'Please check inputs and try again.' })
    } finally {
      setCreating(false)
    }
  }

  /* ----------- Edit ----------- */
  function openEdit(r: Row) {
    setEditRow(r)
    setEName(r.name); setEEmail(r.email); setEExpertise(r.expertise || '')
    setECourseId(r.courseId || '')
    setERoleId(r.roleId || instructorRoleId || '')
    setEditOpen(true)
  }
  async function safeEditUser(id: string, payload: any) {
    try { return await api.patch(`/api/user/edit-user/${id}`, payload) }
    catch (err: any) {
      const s = err?.response?.status
      if (s === 404 || s === 405) return await api.put(`/api/user/edit-user/${id}`, payload)
      throw err
    }
  }
  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editRow) return
    setSaving(true)
    try {
      const body = {
        fullName: eName,
        email: eEmail,
        expertise: eExpertise || undefined,
        roleId: eRoleId || instructorRoleId || undefined,
        courseId: eCourseId || undefined,
      }
      const { data } = await safeEditUser(editRow.id, body)
      showToast({ kind: 'success', title: 'Instructor updated', message: data?.message || 'Changes saved' })
      setEditOpen(false)
      await preload()
    } catch (err: any) {
      showToast({ kind: 'error', title: 'Update failed', message: err?.response?.data?.message || 'Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  /* ---------- Delete ---------- */
  async function onDelete() {
    if (!confirmId) return
    setDeleting(true)
    try {
      const { data } = await api.delete(`/api/user/delete-user/${confirmId}`)
      showToast({ kind: 'success', title: 'Instructor deleted', message: data?.message || 'Removed successfully' })
      setConfirmId(null)
      await preload()
    } catch (err: any) {
      showToast({ kind: 'error', title: 'Delete failed', message: err?.response?.data?.message || 'Please try again.' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    // <- limit page width so the table doesn’t stretch too far
    <div className="space-y-4 max-w-[1200px] mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Instructor Management</h1>
          <p className="text-neutral-500">Manage all instructors in the academy</p>
        </div>
        <Button className="inline-flex items-center gap-2 rounded-xl bg-[#0B5CD7] px-4 py-2 text-white hover:brightness-95" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Instructor
        </Button>
      </div>

      <Card>
        <CardHeader>
          {/* Search with aligned icon */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search instructors..."
              aria-label="Search instructors"
              className="h-12 w-full rounded-2xl border border-neutral-200 bg-[#F4F5F7] pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#0B5CD7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5CD7]/20"
            />
          </div>
        </CardHeader>

        <CardContent className="overflow-hidden">
          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {loading ? (
              <div className="py-8 text-center text-neutral-500">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-neutral-500">No instructors found.</div>
            ) : (
              filtered.map(r => (
                <div key={r.id} className="rounded-2xl border border-neutral-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-neutral-900">{r.name}</div>
                      <div className="text-sm text-neutral-700">{r.email}</div>
                      {r.expertise && <div className="mt-1 text-sm text-neutral-700">{r.expertise}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="rounded-md p-2 hover:bg-neutral-100" title="Edit" onClick={() => openEdit(r)}>
                        <SquarePen className="h-4 w-4 text-neutral-700" />
                      </button>
                      <button className="rounded-md p-2 hover:bg-neutral-100" title="Delete" onClick={() => setConfirmId(r.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  {r.courseTitles.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">{renderCourseChips(r.courseTitles)}</div>
                  )}
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-neutral-600">{r.joinDate}</span>
                    {renderStatusBadge(r.status)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[980px] table-fixed border-separate border-spacing-0">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-neutral-700">
                  <Th className="w-[220px]">Instructor</Th>
                  <Th className="w-[200px]">Email</Th>
                  <Th className="w-[180px]">Expertise</Th>
                  <Th className="w-[180px]">Assigned Courses</Th>
                  <Th className="w-[140px]">Join Date</Th>
                  <Th className="w-[110px]">Status</Th>
                  <Th className="w-[110px]">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="py-10 text-center text-neutral-500">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-10 text-center text-neutral-500">No instructors found.</td></tr>
                ) : (
                  filtered.map(r => (
                    <tr key={r.id} className="border-b border-neutral-200 last:border-0">
                      <Td className="font-medium text-neutral-900 whitespace-nowrap overflow-hidden text-ellipsis">{r.name}</Td>
                      <Td className="text-neutral-700 whitespace-nowrap overflow-hidden text-ellipsis">{r.email}</Td>
                      <Td className="text-neutral-800 whitespace-nowrap overflow-hidden text-ellipsis">{r.expertise || '-'}</Td>
                      <Td className="space-x-2">{renderCourseChips(r.courseTitles)}</Td>
                      <Td className="whitespace-nowrap">{r.joinDate}</Td>
                      <Td>{renderStatusBadge(r.status)}</Td>
                      <Td className="flex items-center gap-3">
                        <button className="text-neutral-600 hover:text-black" title="Edit" onClick={() => openEdit(r)}>
                          <SquarePen className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-700" title="Delete" onClick={() => setConfirmId(r.id)}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create modal */}
      {createOpen && (
        <Modal title="Add New Instructor" subtext="Add a new instructor and assign courses" onClose={() => !creating && setCreateOpen(false)}>
          <form onSubmit={onCreate} className="space-y-4">
            <div className="grid gap-4">
              <LabeledInput label="Name" placeholder="Full name" value={cName} onChange={e => setCName(e.target.value)} required />
              <LabeledInput label="Email" type="email" placeholder="Email address" value={cEmail} onChange={e => setCEmail(e.target.value)} required />
              <LabeledInput label="Expertise" placeholder="Area of expertise" value={cExpertise} onChange={e => setCExpertise(e.target.value)} />
              <LabeledSelect
                label="Assign Course"
                placeholder="Select course"
                value={cCourseId}
                onChange={setCCourseId}
                options={courses.map(c => ({ value: c.id, label: c.title }))}
              />
            </div>
            <div className="flex items-center justify-end">
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#0B5CD7] px-4 py-2 text-white hover:brightness-95" disabled={creating}>
                <Mail className="h-4 w-4" />
                {creating ? 'Adding…' : 'Add & Send Email'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit modal */}
      {editOpen && editRow && (
        <Modal title="Edit Instructor" onClose={() => !saving && setEditOpen(false)}>
          <form onSubmit={onSave} className="space-y-4">
            <div className="grid gap-4">
              <LabeledInput label="Name" value={eName} onChange={e => setEName(e.target.value)} required />
              <LabeledInput label="Email" type="email" value={eEmail} onChange={e => setEEmail(e.target.value)} required />
              <LabeledInput label="Expertise" value={eExpertise} onChange={e => setEExpertise(e.target.value)} />
              <LabeledSelect
                label="Assign Course"
                placeholder="Select course"
                value={eCourseId}
                onChange={setECourseId}
                options={courses.map(c => ({ value: c.id, label: c.title }))}
              />
              <input type="hidden" value={eRoleId} onChange={() => {}} />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {confirmId && (
        <Modal title="Delete Instructor" onClose={() => !deleting && setConfirmId(null)}>
          <p className="text-sm text-neutral-700">Are you sure you want to delete this instructor? This action cannot be undone.</p>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button className="btn-secondary" onClick={() => setConfirmId(null)} disabled={deleting}>Cancel</button>
            <button className="btn-primary bg-red-600 hover:bg-red-700" onClick={onDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* — table cells — */
function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`py-3 text-sm font-semibold ${className}`}>{children}</th>
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-4 text-sm ${className}`}>{children}</td>
}

/* — chips / status — */
function renderCourseChips(titles: string[]) {
  if (!titles?.length) return <span className="text-neutral-500">-</span>
  if (titles.length <= 2) {
    return titles.map(t => (
      <span key={t} className="inline-flex items-center rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700">{t}</span>
    ))
  }
  const shown = titles.slice(0, 2)
  const rest = titles.slice(2)
  return (
    <>
      {shown.map(t => (
        <span key={t} className="inline-flex items-center rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700">{t}</span>
      ))}
      <span title={rest.join(', ')} className="inline-flex items-center rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700">+{rest.length}</span>
    </>
  )
}
function formatDate(iso?: string) { if (!iso) return '-'; try { return iso.slice(0, 10) } catch { return '-' } }
function mapStatus(s?: string) { const v=(s||'').toLowerCase(); if(v==='active')return'Active'; if(v==='inactive')return'Inactive'; if(v==='pending')return'Pending'; return'Unknown' }
function renderStatusBadge(s: ReturnType<typeof mapStatus>) {
  if (s === 'Active')   return <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">Active</span>
  if (s === 'Inactive') return <span className="inline-flex items-center rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700">Inactive</span>
  if (s === 'Pending')  return <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-800">Pending</span>
  return <span className="inline-flex items-center rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700">Unknown</span>
}

/* — modal & labeled controls — */
function Modal({ title, subtext, onClose, children }: { title: string; subtext?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose} />
      <div className="fixed inset-0 z-50 grid place-items-center px-4">
        <div className="w-full max-w-xl rounded-2xl border border-neutral-200 bg-white shadow-xl">
          <div className="flex items-start justify-between px-6 py-5 border-b border-neutral-200">
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              {subtext && <p className="mt-1 text-sm text-neutral-600">{subtext}</p>}
            </div>
            <button className="rounded-md p-2 hover:bg-neutral-100" onClick={onClose} aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* allow dropdown to overflow */}
          <div className="px-6 py-5 overflow-visible">{children}</div>
        </div>
      </div>
    </>
  )
}

function LabeledInput({
  label, type = 'text', placeholder, value, onChange, required,
}: {
  label: string
  type?: string
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-neutral-800">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="h-11 w-full rounded-xl border border-neutral-200 bg-[#F4F5F7] px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#0B5CD7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5CD7]/20"
      />
    </div>
  )
}

function LabeledSelect({
  label, placeholder, value, onChange, options,
}: {
  label: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <label className="mb-1 block text-sm font-medium text-neutral-800">{label}</label>
      <button
        type="button"
        className="relative h-11 w-full rounded-xl border border-neutral-200 bg-[#F4F5F7] px-3 pr-10 text-left text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#0B5CD7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5CD7]/20"
        onClick={() => setOpen(o => !o)}
      >
        {value ? (options.find(o => o.value === value)?.label ?? '') : <span className="text-neutral-400">{placeholder || 'Select course'}</span>}
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
          <ul className="max-h-60 overflow-auto py-1">
            {options.map(opt => (
              <li
                key={opt.value}
                onMouseDown={(e) => { e.preventDefault(); onChange(opt.value); setOpen(false) }}
                className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-[#0B5CD7] hover:text-white"
              >
                <span>{opt.label}</span>
                {opt.value === value && <Check className="h-4 w-4" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

