import { useEffect, useMemo, useState, useCallback, memo } from 'react'
import { Plus, Search, SquarePen, Trash2, X, ChevronDown, Check } from 'lucide-react'
import { api } from '../../lib/api'
import { showToast } from '../../lib/toast'
import { createPortal } from 'react-dom'

type Course = {
  id: string
  title: string
  category: string
  description?: string
  duration?: string
  createdAt?: string
  updatedAt?: string
  noOfStudents?: number
  students?: Array<unknown>
  instructors?: Array<{ fullName?: string }>
}

type Mode = 'create' | 'edit'

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  // modal state (no typing fields here!)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<Mode>('create')
  const [editing, setEditing] = useState<Course | null>(null)

  const [working, setWorking] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  useEffect(() => { void loadCourses() }, [])

  async function loadCourses() {
    setLoading(true)
    try {
      const { data } = await api.get('/api/courses/all-courses')
      const list: Course[] = Array.isArray(data)
        ? data.map((c: any) => ({
            ...c,
            noOfStudents: c.noOfStudents ?? (c.students ? c.students.length : 0),
          }))
        : []
      setCourses(list)
    } catch (e: any) {
      showToast({ kind: 'error', title: 'Could not load courses', message: e?.response?.data?.message || 'Please try again.' })
    } finally { setLoading(false) }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return courses
    return courses.filter(c =>
      [c.title, c.category, c.duration, c.description]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q))
    )
  }, [courses, query])

  // open modals (no form values set here)
  const openCreate = useCallback(() => {
    setModalMode('create')
    setEditing(null)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((course: Course) => {
    setModalMode('edit')
    setEditing(course)
    setModalOpen(true)
  }, [])

  // network actions (called by modal on submit)
  const createCourse = useCallback(async (payload: {
    title: string; category: 'beginner'|'intermediate'|'advanced';
    duration: string; description?: string
  }) => {
    setWorking(true)
    try {
      const { data } = await api.post('/api/courses/create-course', payload)
      showToast({ kind: 'success', title: 'Course created', message: `${data?.title || payload.title} was added.` })
      setModalOpen(false)
      await loadCourses()
    } catch (e: any) {
      showToast({ kind: 'error', title: 'Create failed', message: e?.response?.data?.message || 'Please try again.' })
    } finally { setWorking(false) }
  }, [])

  const updateCourse = useCallback(async (id: string, payload: {
    title: string; category: 'beginner'|'intermediate'|'advanced';
    duration: string; description?: string
  }) => {
    setWorking(true)
    try {
      await api.put(`/api/courses/edit-course/${id}`, payload)
      showToast({ kind: 'success', title: 'Course updated', message: `${payload.title} has been updated.` })
      setModalOpen(false)
      await loadCourses()
    } catch (e: any) {
      showToast({ kind: 'error', title: 'Update failed', message: e?.response?.data?.message || 'Please try again.' })
    } finally { setWorking(false) }
  }, [])

  const onDelete = useCallback(async (id: string) => {
    setWorking(true)
    try {
      await api.delete(`/api/courses/delete/${id}`)
      showToast({ kind: 'success', title: 'Course deleted', message: 'The course was removed.' })
      setConfirmId(null)
      await loadCourses()
    } catch (e: any) {
      showToast({ kind: 'error', title: 'Delete failed', message: e?.response?.data?.message || 'Please try again.' })
    } finally { setWorking(false) }
  }, [])

  const ultraBusy = loading || working

  return (
    <>
      <div className="space-y-4 max-w-[1200px] mx-auto">
        <div>
          <h2 className="text-2xl sm:text-[22px] font-semibold text-neutral-900">Course Management</h2>
          <p className="text-sm text-neutral-500">Manage all courses in the academy</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white">
          {/* Top row */}
          <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search courses..."
                className="h-12 w-full rounded-2xl border border-neutral-200 bg-[#F4F5F7] pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#0B5CD7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5CD7]/20"
                aria-label="Search courses"
              />
            </div>

            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B5CD7] px-4 py-2 text-white hover:brightness-95"
            >
              <Plus className="h-4 w-4" />
              Add Course
            </button>
          </div>

          {/* Table (memoized) */}
          <div className="px-3 pb-3 sm:px-4 sm:pb-4">
            <div className="overflow-x-auto">
              <CoursesTable
                loading={loading}
                rows={filtered}
                onEdit={openEdit}
                onAskDelete={setConfirmId}
              />
            </div>
          </div>
        </div>

        {/* Editor modal (local typing state inside) */}
        {modalOpen && (
          <CourseEditorModal
            mode={modalMode}
            initial={editing ?? undefined}
            onClose={() => !working && setModalOpen(false)}
            onCreate={createCourse}
            onUpdate={(payload) => editing && updateCourse(editing.id, payload)}
            working={working}
          />
        )}

        {/* Confirm Delete */}
        {confirmId && (
          <Modal onClose={() => !working && setConfirmId(null)} title="Delete Course">
            <p className="text-sm text-neutral-700">Are you sure you want to delete this course? This action cannot be undone.</p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button className="btn-secondary text-white bg-gray-600 rounded-lg p-2 " onClick={() => setConfirmId(null)} disabled={working}>Cancel</button>
              <button className="btn-danger p-2 bg-red-700 text-white rounded-lg" onClick={() => onDelete(confirmId)} disabled={working}>Delete</button>
            </div>
          </Modal>
        )}
      </div>

      {/* Ultra loader */}
      <UltraLoader
        show={ultraBusy}
        label={
          loading ? 'Loading courses…' :
          working && modalOpen && modalMode === 'create' ? 'Creating course…' :
          working && modalOpen && modalMode === 'edit' ? 'Saving changes…' :
          working && !!confirmId ? 'Deleting course…' : ''
        }
      />
    </>
  )
}

/* ----------------- Modal with local typing state ----------------- */

function CourseEditorModal({
  mode,
  initial,
  onClose,
  onCreate,
  onUpdate,
  working,
}: {
  mode: 'create' | 'edit'
  initial?: Course
  onClose: () => void
  onCreate: (p: { title: string; category: 'beginner'|'intermediate'|'advanced'; duration: string; description?: string }) => void
  onUpdate: (p: { title: string; category: 'beginner'|'intermediate'|'advanced'; duration: string; description?: string }) => void
  working: boolean
}) {
  // typing state lives *only* here
  const [title, setTitle] = useState(initial?.title || '')
  const [category, setCategory] = useState<'beginner'|'intermediate'|'advanced'|''>(
    initial ? (['beginner','intermediate','advanced'].includes((initial.category||'').toLowerCase()) ? (initial.category as any) : 'beginner') : ''
  )
  const [duration, setDuration] = useState(initial?.duration || '')
  const [description, setDescription] = useState(initial?.description || '')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !category || !duration) return
    const payload = { title, category: category as 'beginner'|'intermediate'|'advanced', duration, description: description || undefined }
    if (mode === 'create') onCreate(payload)
    else onUpdate(payload)
  }

  return (
    <Modal onClose={onClose} title={mode === 'create' ? 'Add New Course' : 'Edit Course'}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title">
          <input className="input" placeholder="Course title" value={title} onChange={e => setTitle(e.target.value)} required />
        </Field>

        <Field label="Category">
          <Select value={category} onChange={setCategory} placeholder="Select category">
            <Option value="beginner">Beginner</Option>
            <Option value="intermediate">Intermediate</Option>
            <Option value="advanced">Advanced</Option>
          </Select>
        </Field>

        <Field label="Duration">
          <input className="input" placeholder="e.g., 8 weeks" value={duration} onChange={e => setDuration(e.target.value)} required />
        </Field>

        <Field label="Description">
          <textarea className="input min-h-[112px] resize-y" placeholder="Course description" value={description} onChange={e => setDescription(e.target.value)} />
        </Field>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={working}>Cancel</button>
          <button type="submit" className="btn-primary rounded-lg p-2" disabled={working}>
            {mode === 'create' ? 'Create Course' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/* ----------------- Memoized table ----------------- */

const CoursesTable = memo(function CoursesTable({
  loading,
  rows,
  onEdit,
  onAskDelete,
}: {
  loading: boolean
  rows: Course[]
  onEdit: (c: Course) => void
  onAskDelete: (id: string | null) => void
}) {
  return (
    <table className="w-full table-fixed border-separate border-spacing-0 min-w-[980px]">
      <thead>
        <tr className="text-left text-neutral-700">
          <Th>Course</Th>
          <Th>Category</Th>
          <Th>Duration</Th>
          <Th>Students</Th>
          <Th>Instructor</Th>
          <Th>Status</Th>
          <Th className="w-24 text-center">Actions</Th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <SkRows cols={7} rows={5} />
        ) : rows.length === 0 ? (
          <tr><td colSpan={7} className="py-10 text-center text-neutral-500">No courses found.</td></tr>
        ) : (
          rows.map((c) => (
            <tr key={c.id} className="border-b border-neutral-200 last:border-0">
              <Td className="font-medium text-neutral-900">{c.title}</Td>
              <Td>{pretty(c.category)}</Td>
              <Td>{c.duration || '-'}</Td>
              <Td>{c.noOfStudents ?? (c.students ? c.students.length : 0)}</Td>
              <Td>{c.instructors?.[0]?.fullName ?? '-'}</Td>
              <Td>
                {isDraft(c)
                  ? <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">Draft</span>
                  : <span className="inline-flex items-center rounded-full bg-[#0B5CD7] px-2 py-0.5 text-xs text-white">Active</span>}
              </Td>
              <Td className="text-center">
                <div className="flex items-center justify-center gap-3">
                  <button className="rounded-md p-2 hover:bg-neutral-100" aria-label="Edit" onClick={() => onEdit(c)}>
                    <SquarePen className="h-4 w-4 text-neutral-700" />
                  </button>
                  <button className="rounded-md p-2 hover:bg-neutral-100" aria-label="Delete" onClick={() => onAskDelete(c.id)}>
                    <Trash2 className="h-4 w-4 text-[#FF6A3D]" />
                  </button>
                </div>
              </Td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  )
})

/* ----------------- Presentational helpers ----------------- */

function isDraft(c: Course) {
  const status = (c as any).status?.toString().toLowerCase()
  return status ? status === 'draft' : false
}
function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`py-3 text-sm font-semibold ${className}`}>{children}</th>
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-3 text-sm text-neutral-700 ${className}`}>{children}</td>
}
function pretty(v?: string) { if (!v) return '-'; return v.replace(/_/g, ' ').replace(/\b\w/g, m => m.toUpperCase()) }

/* ----------------- Base modal (portal) ----------------- */

function Modal({ onClose, title, subtext, children }: { onClose: () => void; title: string; subtext?: string; children: React.ReactNode }) {
  const el = useState(() => {
    const d = document.createElement('div')
    d.setAttribute('data-modal-root', 'true')
    return d
  })[0]

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

  return createPortal(
    <>
      <div className="fixed inset-0 z-[10000] h-screen w-screen bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 z-[10001] grid place-items-center px-4" onClick={onClose}>
        <div role="dialog" aria-modal="true" aria-labelledby="modal-title"
             className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white shadow-xl"
             onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between px-6 py-5 border-b border-neutral-200">
            <div>
              <h3 id="modal-title" className="text-lg font-semibold">{title}</h3>
              {subtext && <p className="mt-1 text-sm text-neutral-600">{subtext}</p>}
            </div>
            <button className="rounded-md p-2 hover:bg-neutral-100" onClick={onClose} aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="px-6 py-5 overflow-visible">{children}</div>
        </div>
      </div>
    </>,
    el
  )
}

/* ----------------- Small UI bits ----------------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

function Select<T extends string>({ value, onChange, placeholder, children }: { value: T | ''; onChange: (v: T) => void; placeholder?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const opts = Array.isArray(children) ? children : [children]
  const labels = opts.map((c: any) => c.props.children)
  const values = opts.map((c: any) => c.props.value as T)
  const selectedIdx = values.findIndex(v => v === value)
  const selectedLabel = selectedIdx >= 0 ? labels[selectedIdx] : ''
  return (
    <div className="relative">
      <button type="button" className="input w-full text-left pr-10" onClick={() => setOpen(o => !o)}>
        {selectedLabel || <span className="text-neutral-400">{placeholder || 'Select…'}</span>}
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-2 z-20 rounded-xl border border-neutral-200 bg-white shadow-lg overflow-hidden">
          <ul className="py-1 max-h-60 overflow-auto">
            {values.map((v, i) => {
              const isSel = v === value
              return (
                <li
                  key={v as string}
                  onMouseDown={(e) => { e.preventDefault(); onChange(v as T); setOpen(false) }}
                  className="px-3 py-2 cursor-pointer flex items-center justify-between hover:bg-[#0B5CD7] hover:text-white text-sm"
                >
                  <span>{labels[i]}</span>
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
function Option<T extends string>({ children }: { value: T; children: React.ReactNode }) { return <>{children}</> }

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
