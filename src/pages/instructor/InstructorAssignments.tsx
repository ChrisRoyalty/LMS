import React, { useEffect, useMemo, useState, memo, useCallback } from 'react'
import { Plus, Search, SquarePen, Check, ChevronDown, X, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { showToast } from '../../lib/toast'
import { createPortal } from 'react-dom'

type Course = { id: string; title: string }
type Assignment = {
  id: string
  title: string
  description?: string
  courseId: string
  courseTitle?: string
  deadline?: string
  maxScore?: number
  assignmentType?: 'ASSIGNMENT' | 'QUIZ' | 'PROJECT' | 'CAPSTONE'
  status?: 'Active' | 'Completed' | 'Draft'
  submissions?: number
}

export default function InstructorAssignments() {
  const [courses, setCourses] = useState<Course[]>([])
  const [rows, setRows] = useState<Assignment[]>([])
  const [query, setQuery] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  // IMPORTANT: split flags — listLoading never blocks inputs; working only during mutations
  const [listLoading, setListLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // create form
  const [cTitle, setCTitle] = useState('')
  const [cCourseId, setCCourseId] = useState('')
  const [cType, setCType] = useState<'ASSIGNMENT' | 'QUIZ' | 'PROJECT' | 'CAPSTONE' | ''>('')
  const [cDeadline, setCDeadline] = useState('')
  const [cDesc, setCDesc] = useState('')
  const [cMax, setCMax] = useState<number | ''>('')

  // edit form
  const [eId, setEId] = useState<string>('')
  const [eTitle, setETitle] = useState('')
  const [eCourseId, setECourseId] = useState('')
  const [eType, setEType] = useState<'ASSIGNMENT' | 'QUIZ' | 'PROJECT' | 'CAPSTONE' | ''>('')
  const [eDeadline, setEDeadline] = useState('')
  const [eDesc, setEDesc] = useState('')
  const [eMax, setEMax] = useState<number | ''>('')

  function authHeaders() {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('access_token') ||
      ''
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  useEffect(() => {
    setListLoading(true)
    api
      .get('/api/courses/all-courses', { headers: { ...authHeaders() } })
      .then(({ data }) => {
        const list: Course[] = Array.isArray(data) ? data.map((c: any) => ({ id: c.id, title: c.title })) : []
        setCourses(list)
      })
      .catch((e) => {
        const msg = e?.response?.status === 403 ? 'Forbidden: insufficient role' : e?.response?.data?.message || 'Please try again.'
        showToast({ kind: 'error', title: 'Could not load courses', message: msg })
      })
      .finally(() => setListLoading(false))
  }, [])

  // Memoize filtered *inside* the table section to avoid recompute during modal typing.
  // Here we just keep rows & query in parent.

  /* ------------ Handlers (useCallback to keep stable identities) ------------ */
  const openCreate = useCallback(() => {
    setCTitle(''); setCCourseId(''); setCType(''); setCDeadline(''); setCDesc(''); setCMax('')
    setCreateOpen(true)
  }, [])

  const openEdit = useCallback((a: Assignment) => {
    setEId(a.id)
    setETitle(a.title)
    setECourseId(a.courseId)
    setEType(((a.assignmentType as any) || '').toUpperCase() as any)
    setEDeadline(a.deadline ? toDateOnly(a.deadline) : '')
    setEDesc(a.description || '')
    setEMax(typeof a.maxScore === 'number' ? a.maxScore : '')
    setEditOpen(true)
  }, [])

  const onCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cTitle || !cCourseId || !cType || !cDeadline) {
      showToast({ kind: 'warning', title: 'Missing fields', message: 'Please fill title, course, type and due date.' })
      return
    }
    setWorking(true)
    try {
      const payload = {
        title: cTitle,
        description: cDesc || undefined,
        courseId: cCourseId,
        deadline: cDeadline, // YYYY-MM-DD
        maxScore: cMax === '' ? undefined : Number(cMax),
        assignmentType: String(cType).toUpperCase() as Assignment['assignmentType'],
      }
      const { data } = await api.post('/api/assignments/create-assignment', payload, { headers: { ...authHeaders() } })
      const created = data?.assignment as any
      const courseTitle = courses.find((c) => c.id === created?.courseId)?.title
      setRows((prev) => [
        {
          id: created?.id,
          title: created?.title,
          description: created?.description,
          courseId: created?.courseId,
          courseTitle,
          deadline: toDateOnly(created?.deadline),
          maxScore: created?.maxScore,
          assignmentType: (created?.assignmentType || 'ASSIGNMENT') as any,
          status: 'Active',
          submissions: 0,
        },
        ...prev,
      ])
      showToast({ kind: 'success', title: 'Assignment created', message: data?.message || 'Saved successfully.' })
      setCreateOpen(false)
    } catch (err: any) {
      const msg = err?.response?.status === 403 ? 'Forbidden: insufficient role' : err?.response?.data?.message || 'Please try again.'
      showToast({ kind: 'error', title: 'Create failed', message: msg })
    } finally {
      setWorking(false)
    }
  }, [cTitle, cCourseId, cType, cDeadline, cDesc, cMax, courses])

  const onEdit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eId || !eTitle || !eCourseId || !eType || !eDeadline) {
      showToast({ kind: 'warning', title: 'Missing fields', message: 'Please fill title, course, type and due date.' })
      return
    }
    setWorking(true)
    try {
      const payload = {
        title: eTitle,
        description: eDesc || undefined,
        courseId: eCourseId,
        deadline: eDeadline, // YYYY-MM-DD
        maxScore: eMax === '' ? undefined : Number(eMax),
        assignmentType: String(eType).toUpperCase() as Assignment['assignmentType'],
      }
      const { data } = await api.put(`/api/assignments/edit-assignment/${eId}`, payload, { headers: { ...authHeaders() } })
      const updated = data?.date || null
      setRows((prev) =>
        prev.map((r) =>
          r.id === eId
            ? {
                ...r,
                title: updated?.title ?? eTitle,
                description: updated?.description ?? (eDesc || undefined),
                courseId: updated?.courseId ?? eCourseId,
                courseTitle: courses.find((c) => c.id === (updated?.courseId ?? eCourseId))?.title,
                deadline: toDateOnly(updated?.deadline ?? eDeadline),
                maxScore: typeof (updated?.maxScore ?? eMax) === 'number' ? (updated?.maxScore ?? Number(eMax)) : undefined,
                assignmentType: ((updated?.assignmentType ?? eType) as any),
              }
            : r,
        ),
      )
      showToast({ kind: 'success', title: 'Assignment updated', message: data?.message || 'Changes saved.' })
      setEditOpen(false)
    } catch (err: any) {
      const msg = err?.response?.status === 403 ? 'Forbidden: insufficient role' : err?.response?.data?.message || 'Please try again.'
      showToast({ kind: 'error', title: 'Update failed', message: msg })
    } finally {
      setWorking(false)
    }
  }, [eId, eTitle, eCourseId, eType, eDeadline, eDesc, eMax, courses])

  const onDelete = useCallback(async (id: string) => {
    const ok = window.confirm('Delete this assignment? This cannot be undone.')
    if (!ok) return
    setWorking(true)
    setDeletingId(id)
    try {
      await api.delete(`/api/assignments/delete-assignment/${id}`, { headers: { ...authHeaders() } })
      setRows(prev => prev.filter(r => r.id !== id))
      showToast({ kind: 'success', title: 'Assignment deleted', message: 'Removed successfully.' })
    } catch (err: any) {
      const msg = err?.response?.status === 403 ? 'Forbidden: insufficient role' : err?.response?.data?.message || 'Please try again.'
      showToast({ kind: 'error', title: 'Delete failed', message: msg })
    } finally {
      setDeletingId(null)
      setWorking(false)
    }
  }, [])

  const showOverlay = working

  return (
    <>
      <div className="space-y-4 max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-[22px] font-semibold text-neutral-900">Assignment Management</h2>
            <p className="text-sm text-neutral-500">Create and manage assignments for your courses</p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0B5CD7] px-4 py-2 text-white hover:brightness-95"
          >
            <Plus className="h-4 w-4" />
            Create Assignment
          </button>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white">
          {/* Filters row */}
          <div className="flex flex-col gap-3 p-3 sm:p-4">
            <div className="relative max-w-lg">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search assignments..."
                className="h-12 w-full rounded-2xl border border-neutral-200 bg-[#F4F5F7] pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#0B5CD7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5CD7]/20"
                aria-label="Search assignments"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Pill>All Assignments</Pill>
              <Pill>Active</Pill>
              <Pill>Completed</Pill>
              <Pill>Need Grading</Pill>
            </div>
          </div>

          {/* Table */}
          <div className="px-3 pb-3 sm:px-4 sm:pb-4">
            <TableSection
              rows={rows}
              query={query}
              courses={courses}
              listLoading={listLoading}
              openEdit={openEdit}
              onDelete={onDelete}
              working={working}
              deletingId={deletingId}
            />
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {createOpen && (
        <Modal title="Create New Assignment" subtext="Create a new assignment for your students" onClose={() => !working && setCreateOpen(false)}>
          <form onSubmit={onCreate} className="space-y-4">
            <Field label="Title">
              <input
                className="input"
                placeholder="Assignment title"
                value={cTitle}
                onChange={(e) => setCTitle(e.target.value)}
                required
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Course">
                <HeadlessSelect
                  value={cCourseId}
                  onChange={setCCourseId}
                  placeholder="Select course"
                  options={courses.map((c) => ({ value: c.id, label: c.title }))}
                />
              </Field>

              <Field label="Type">
                <HeadlessSelect
                  value={cType}
                  onChange={(v) => setCType((String(v).toUpperCase() as any))}
                  placeholder="Assignment type"
                  options={[
                    { value: 'ASSIGNMENT', label: 'Assignment' },
                    { value: 'PROJECT', label: 'Project' },
                    { value: 'QUIZ', label: 'Quiz' },
                    { value: 'CAPSTONE', label: 'Capstone' },
                  ]}
                />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Due Date">
                <input className="input" type="date" value={cDeadline} onChange={(e) => setCDeadline(e.target.value)} required />
              </Field>
              <Field label="Max Score">
                <input
                  className="input"
                  type="number"
                  min={0}
                  placeholder="e.g., 100"
                  value={cMax}
                  onChange={(e) => setCMax(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                className="input min-h-[112px] resize-y"
                placeholder="Assignment instructions and requirements"
                value={cDesc}
                onChange={(e) => setCDesc(e.target.value)}
              />
            </Field>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setCreateOpen(false)} disabled={working}>
                Cancel
              </button>
              <button type="submit" className="btn-primary rounded-lg p-2" disabled={working}>
                Create Assignment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editOpen && (
        <Modal title="Edit Assignment" subtext="Update assignment details" onClose={() => !working && setEditOpen(false)}>
          <form onSubmit={onEdit} className="space-y-4">
            <Field label="Title">
              <input
                className="input"
                placeholder="Assignment title"
                value={eTitle}
                onChange={(e) => setETitle(e.target.value)}
                required
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Course">
                <HeadlessSelect
                  value={eCourseId}
                  onChange={setECourseId}
                  placeholder="Select course"
                  options={courses.map((c) => ({ value: c.id, label: c.title }))}
                />
              </Field>

              <Field label="Type">
                <HeadlessSelect
                  value={eType}
                  onChange={(v) => setEType((String(v).toUpperCase() as any))}
                  placeholder="Assignment type"
                  options={[
                    { value: 'ASSIGNMENT', label: 'Assignment' },
                    { value: 'PROJECT', label: 'Project' },
                    { value: 'QUIZ', label: 'Quiz' },
                    { value: 'CAPSTONE', label: 'Capstone' },
                  ]}
                />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Due Date">
                <input className="input" type="date" value={eDeadline} onChange={(e) => setEDeadline(e.target.value)} required />
              </Field>
              <Field label="Max Score">
                <input
                  className="input"
                  type="number"
                  min={0}
                  placeholder="e.g., 100"
                  value={eMax}
                  onChange={(e) => setEMax(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                className="input min-h-[112px] resize-y"
                placeholder="Assignment instructions and requirements"
                value={eDesc}
                onChange={(e) => setEDesc(e.target.value)}
              />
            </Field>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setEditOpen(false)} disabled={working}>
                Cancel
              </button>
              <button type="submit" className="btn-primary rounded-lg p-2" disabled={working}>
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Mutation overlay (no blur) */}
      <UltraLoader
        show={showOverlay}
        label={
          working && createOpen ? 'Creating assignment…' :
          working && editOpen   ? 'Saving changes…'   :
          working && deletingId ? 'Deleting assignment…' : 'Please wait…'
        }
      />
    </>
  )
}

/* ---------------- Table (Memoized) ---------------- */
const TableSection = memo(function TableSection({
  rows, query, courses, listLoading, openEdit, onDelete, working, deletingId,
}: {
  rows: Assignment[]
  query: string
  courses: Course[]
  listLoading: boolean
  openEdit: (a: Assignment) => void
  onDelete: (id: string) => void
  working: boolean
  deletingId: string | null
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      [r.title, r.courseTitle, r.assignmentType, r.deadline].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)),
    )
  }, [rows, query])

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-separate border-spacing-0 min-w-[980px]">
        <thead>
          <tr className="text-left text-neutral-700">
            <Th>Assignment</Th>
            <Th>Course</Th>
            <Th>Type</Th>
            <Th>Due Date</Th>
            <Th>Submissions</Th>
            <Th>Status</Th>
            <Th className="w-28 text-center">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {listLoading ? (
            <SkRows cols={7} rows={5} />
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-10 text-center text-neutral-500">No assignments yet.</td>
            </tr>
          ) : (
            filtered.map((a) => (
              <tr key={a.id} className="border-b border-neutral-200 last:border-0">
                <Td className="font-medium text-neutral-900">{a.title}</Td>
                <Td>{a.courseTitle || courses.find((c) => c.id === a.courseId)?.title || '-'}</Td>
                <Td>{prettyType(a.assignmentType)}</Td>
                <Td>{a.deadline ? a.deadline : '-'}</Td>
                <Td>{a.submissions ?? 0}</Td>
                <Td>
                  {a.status === 'Active' ? (
                    <span className="inline-flex items-center rounded-full bg-[#0B5CD7] px-2 py-0.5 text-xs text-white">Active</span>
                  ) : a.status === 'Completed' ? (
                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">Completed</span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">Draft</span>
                  )}
                </Td>
                <Td className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button className="rounded-md p-2 hover:bg-neutral-100" title="Edit" onClick={() => openEdit(a)}>
                      <SquarePen className="h-4 w-4 text-neutral-700" />
                    </button>
                    <button
                      className="rounded-md p-2 hover:bg-neutral-100"
                      title="Delete"
                      onClick={() => onDelete(a.id)}
                      disabled={working && deletingId === a.id}
                    >
                      <Trash2 className={`h-4 w-4 ${deletingId === a.id ? 'text-rose-400' : 'text-rose-600'}`} />
                    </button>
                  </div>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
})

/* ---------------- Presentational ---------------- */
function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs text-neutral-700">{children}</span>
}
function prettyType(t?: Assignment['assignmentType']) {
  if (!t) return '-'
  const key = String(t).toUpperCase()
  const m: any = { ASSIGNMENT: 'Assignment', QUIZ: 'Quiz', PROJECT: 'Project', CAPSTONE: 'Capstone' }
  return m[key] || key
}
function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`py-3 text-sm font-semibold ${className}`}>{children}</th>
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-3 text-sm text-neutral-700 ${className}`}>{children}</td>
}
function SkRows({ cols, rows }: { cols: number; rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-neutral-200 last:border-0">
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="py-3">
              <div className="h-4 w-[70%] rounded bg-neutral-200 animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/* ---------------- Modal (no blur; cheap overlay) ---------------- */
function Modal({ onClose, title, subtext, children }: { onClose: () => void; title: string; subtext?: string; children: React.ReactNode }) {
  const el = React.useMemo(() => {
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
      <div className="fixed inset-0 z-[10000] h-screen w-screen bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-[10001] grid place-items-center px-4" onClick={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between px-6 py-5 border-b border-neutral-200">
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              {subtext && <p className="mt-1 text-sm text-neutral-600">{subtext}</p>}
            </div>
            <button className="rounded-md p-2 hover:bg-neutral-100" onClick={onClose} aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="px-6 py-5 overflow-visible">{children}</div>
        </div>
      </div>
    </>
  )
  return createPortal(node, el)
}

/* ---------------- Field & Headless Select ---------------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}
function HeadlessSelect<T extends string>({ value, onChange, placeholder, options }: {
  value: T | ''
  onChange: (v: T) => void
  placeholder?: string
  options: { value: T; label: string }[]
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        className="input w-full text-left pr-10"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {value ? options.find((o) => o.value === value)?.label ?? '' : <span className="text-neutral-400">{placeholder || 'Select…'}</span>}
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-2 z-20 rounded-xl border border-neutral-200 bg-white shadow-lg overflow-hidden">
          <ul className="py-1 max-h-60 overflow-auto" role="listbox">
            {options.map((opt) => {
              const isSel = opt.value === value
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSel}
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className="px-3 py-2 cursor-pointer flex items-center justify-between hover:bg-[#0B5CD7] hover:text-white text-sm"
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

/* ---------------- Mutation overlay (no blur) ---------------- */
function UltraLoader({ show, label = '' }: { show: boolean; label?: string }) {
  if (!show) return null
  return (
    <div aria-busy="true" role="status" className="fixed inset-0 z-[9999] grid place-items-center bg-black/20">
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

/* ---------------- util ---------------- */
function toDateOnly(d?: string) {
  if (!d) return ''
  const s = String(d)
  return s.length >= 10 ? s.slice(0, 10) : s
}
