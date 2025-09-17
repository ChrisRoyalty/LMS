// src/pages/admin/Students.tsx
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Search, SquarePen, Trash2, Plus, X, ChevronDown, Check } from 'lucide-react'
import { api } from '../../lib/api'
import { showToast } from '../../lib/toast'

type ApiUser = {
  id: string
  fullName: string
  email: string
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
  courseTitles: string[]
  courseId?: string
  joinDate: string
  status: 'Active' | 'Inactive' | 'Pending' | 'Unknown'
}

type Course = { id: string; title: string }
type Batch  = { id: string; name: string }

export default function Students() {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<Row[]>([])

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editRow, setEditRow] = useState<Row | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editCourseId, setEditCourseId] = useState('')
  const [editBatchId, setEditBatchId] = useState('')

  const [courses, setCourses] = useState<Course[]>([])
  const [batches, setBatches] = useState<Batch[]>([])

  // Delete modal
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    void loadStudents()
    void preloadSelects()
  }, [])

  async function preloadSelects() {
    try {
      const [cRes, bRes] = await Promise.all([
        api.get('/api/courses/all-courses'),
        api.get('/api/admin/batches'),
      ])
      setCourses((Array.isArray(cRes.data) ? cRes.data : []).map((x: any) => ({ id: x.id, title: x.title })))
      setBatches(Array.isArray(bRes.data) ? bRes.data : [])
    } catch {/* non-blocking */}
  }

  async function loadStudents() {
    setLoading(true)
    try {
      const { data } = await api.get('/api/user/users', {
        params: { role: 'student', roleName: 'student', page: 1, limit: 1000 },
      })
      const users: ApiUser[] = Array.isArray(data?.data) ? data.data : []
      const students = users.filter(u => (u.role?.name || '').toLowerCase() === 'student')

      const mapped: Row[] = students.map(u => {
        const titles =
          Array.isArray(u.courses) && u.courses.length
            ? u.courses.map(c => c.title).filter(Boolean)
            : u.course?.title ? [u.course.title] : []
        return {
          id: u.id,
          name: u.fullName,
          email: u.email,
          courseTitles: titles,
          courseId: u.course?.id,
          joinDate: formatDate(u.joinedAt),
          status: mapStatus(u.status),
        }
      })
      setRows(mapped)
    } catch (e: any) {
      showToast({ kind: 'error', title: 'Could not load students', message: e?.response?.data?.message || 'Please try again.' })
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
      r.courseTitles.some(c => c.toLowerCase().includes(s)) ||
      r.status.toLowerCase().includes(s)
    )
  }, [q, rows])

  function openEdit(r: Row) {
    setEditRow(r)
    setEditName(r.name)
    setEditEmail(r.email)
    setEditCourseId(r.courseId || '')
    setEditBatchId('') // left empty unless your API returns per-user batch
    setEditOpen(true)
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editRow) return
    setSaving(true)
    try {
      // EDIT: PATCH /api/user/edit-user/:id
      const { data } = await api.put(`/api/user/edit-user/${editRow.id}`, {
        fullName: editName,
        email: editEmail,
        courseId: editCourseId || undefined,
        batchId: editBatchId || undefined,
      })
      showToast({ kind: 'success', title: 'Student updated', message: data?.message || 'Changes saved successfully.' })
      setEditOpen(false)
      await loadStudents()
    } catch (err: any) {
      showToast({ kind: 'error', title: 'Update failed', message: err?.response?.data?.message || 'Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  async function onDelete() {
    if (!confirmId) return
    setDeleting(true)
    try {
      // DELETE: /api/user/delete-user/:id
      const { data } = await api.delete(`/api/user/delete-user/${confirmId}`)
      showToast({ kind: 'success', title: 'Student deleted', message: data?.message || 'The student has been removed.' })
      setConfirmId(null)
      await loadStudents()
    } catch (err: any) {
      showToast({ kind: 'error', title: 'Delete failed', message: err?.response?.data?.message || 'Please try again.' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header + CTA (exact structure) */}
      <div className="flex items-start justify-between max-md:flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Student Management</h1>
          <p className="text-neutral-500">Manage all students in the academy</p>
        </div>
        <Button className="inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Student
        </Button>
      </div>

      <Card>
        <CardHeader>
          {/* Search with icon inside */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search students..."
              aria-label="Search students"
              className="h-12 w-full rounded-2xl border border-neutral-200 bg-[#F4F5F7] pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#0B5CD7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5CD7]/20"
            />
          </div>
        </CardHeader>

        <CardContent className="overflow-hidden">
          {/* Mobile: stacked cards */}
          <div className="grid gap-3 md:hidden">
            {loading ? (
              <div className="py-8 text-center text-neutral-500">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-neutral-500">No students found.</div>
            ) : (
              filtered.map(r => (
                <div key={r.id} className="rounded-2xl border border-neutral-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-neutral-900">{r.name}</div>
                      <div className="text-sm text-neutral-700">{r.email}</div>
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
                    <div className="mt-2 flex flex-wrap gap-2">
                      {renderCourseChips(r.courseTitles)}
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-neutral-600">{r.joinDate}</span>
                    {renderStatusBadge(r.status)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop: roomy table with clamped chips */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[980px] table-fixed border-separate border-spacing-0">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-neutral-700">
                  <Th className="w-[220px]">Student</Th>
                  <Th className="w-[260px]">Email</Th>
                  <Th className="w-[360px]">Enrolled Courses</Th>
                  <Th className="w-[140px]">Join Date</Th>
                  <Th className="w-[110px]">Status</Th>
                  <Th className="w-[110px]">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-10 text-center text-neutral-500">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-neutral-500">No students found.</td></tr>
                ) : (
                  filtered.map(r => (
                    <tr key={r.id} className="border-b border-neutral-200 last:border-0">
                      <Td className="font-medium text-neutral-900 whitespace-nowrap overflow-hidden text-ellipsis">{r.name}</Td>
                      <Td className="text-neutral-700 whitespace-nowrap overflow-hidden text-ellipsis">{r.email}</Td>
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

      {/* Edit modal */}
      {editOpen && editRow && (
        <Modal title="Edit Student" onClose={() => !saving && setEditOpen(false)}>
          <form onSubmit={onSave} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Full name</label>
                <input className="input" value={editName} onChange={e => setEditName(e.target.value)} required />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Email</label>
                <input className="input" type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} required />
              </div>
              <div>
                <label className="label">Course</label>
                <HeadlessSelect
                  value={editCourseId}
                  onChange={setEditCourseId}
                  placeholder="Select course"
                  options={courses.map(c => ({ value: c.id, label: c.title }))}
                />
              </div>
              <div>
                <label className="label">Batch</label>
                <HeadlessSelect
                  value={editBatchId}
                  onChange={setEditBatchId}
                  placeholder="Select batch"
                  options={batches.map(b => ({ value: b.id, label: b.name }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</button>
              <button type="submit" className="btn-primary rounded p-2" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm delete */}
      {confirmId && (
        <Modal title="Delete Student" onClose={() => !deleting && setConfirmId(null)}>
          <p className="text-sm text-neutral-700">Are you sure you want to delete this student? This action cannot be undone.</p>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button className="btn-secondary" onClick={() => setConfirmId(null)} disabled={deleting}>Cancel</button>
            <button className="btn-primary rounded p-2 bg-red-600 hover:bg-red-700" onClick={onDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* — helpers — */
function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`py-3 text-sm font-semibold ${className}`}>{children}</th>
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-4 text-sm ${className}`}>{children}</td>
}
function renderCourseChips(titles: string[]) {
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
      <span title={rest.join(', ')} className="inline-flex items-center rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700">
        +{rest.length}
      </span>
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

/* Modal & headless select (same style language as your app) */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
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

function HeadlessSelect({
  value, onChange, placeholder, options,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  options: { value: string; label: string }[]
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button type="button" className="input w-full text-left pr-10" onClick={() => setOpen(o => !o)}>
        {value ? (options.find(o => o.value === value)?.label ?? '') : <span className="text-neutral-400">{placeholder || 'Select…'}</span>}
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-2 z-20 rounded-xl border border-neutral-200 bg-white shadow-lg overflow-hidden">
          <ul className="max-h-60 overflow-auto py-1">
            {options.map(opt => (
              <li
                key={opt.value}
                onMouseDown={(e) => { e.preventDefault(); onChange(opt.value); setOpen(false) }}
                className="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-neutral-50"
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
