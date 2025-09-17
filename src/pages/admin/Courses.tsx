// src/pages/admin/Courses.tsx
import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, SquarePen, Trash2, X, ChevronDown, Check } from 'lucide-react'
import { api } from '../../lib/api'
import { showToast } from '../../lib/toast'

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
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<Mode>('create')
  const [working, setWorking] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<'beginner'|'intermediate'|'advanced'|''>('')
  const [duration, setDuration] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    void loadCourses()
  }, [])

  async function loadCourses() {
    setLoading(true)
    try {
      // Most backends serve this as GET; if your server needs POST, swap here.
      const { data } = await api.get('/api/courses/all-courses')
      // Normalize: compute students count if not provided
      const list: Course[] = Array.isArray(data) ? data.map((c: any) => ({
        ...c,
        noOfStudents: c.noOfStudents ?? (c.students ? c.students.length : 0),
      })) : []
      setCourses(list)
    } catch (e: any) {
      showToast({
        kind: 'error',
        title: 'Could not load courses',
        message: e?.response?.data?.message || 'Please try again.',
      })
    } finally {
      setLoading(false)
    }
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

  function openCreate() {
    setModalMode('create')
    setEditing(null)
    setTitle('')
    setCategory('')
    setDuration('')
    setDescription('')
    setModalOpen(true)
  }

  function openEdit(course: Course) {
    setModalMode('edit')
    setEditing(course)
    setTitle(course.title || '')
    // map back to one of the allowed values if needed
    const cat = (course.category || '').toLowerCase()
    setCategory(
      cat === 'intermediate' ? 'intermediate' :
      cat === 'advanced' ? 'advanced' : 'beginner'
    )
    setDuration(course.duration || '')
    setDescription(course.description || '')
    setModalOpen(true)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !category || !duration) return
    setWorking(true)
    try {
      if (modalMode === 'create') {
        const payload = { title, description, duration, category }
        const { data } = await api.post('/api/courses/create-course', payload)
        showToast({ kind: 'success', title: 'Course created', message: `${data?.title || title} was added.` })
      } else if (editing) {
        const payload = { title, category, description, duration }
        await api.put(`/api/courses/edit-course/${editing.id}`, payload)
        showToast({ kind: 'success', title: 'Course updated', message: `${title} has been updated.` })
      }
      setModalOpen(false)
      await loadCourses()
    } catch (e: any) {
      showToast({
        kind: 'error',
        title: modalMode === 'create' ? 'Create failed' : 'Update failed',
        message: e?.response?.data?.message || 'Please try again.',
      })
    } finally {
      setWorking(false)
    }
  }

  async function onDelete(id: string) {
    setWorking(true)
    try {
      await api.delete(`/api/courses/delete/${id}`)
      showToast({ kind: 'success', title: 'Course deleted', message: 'The course was removed.' })
      setConfirmId(null)
      await loadCourses()
    } catch (e: any) {
      showToast({
        kind: 'error',
        title: 'Delete failed',
        message: e?.response?.data?.message || 'Please try again.',
      })
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Title & CTA */}
      <div>
        <h2 className="text-2xl sm:text-[22px] font-semibold text-neutral-900">Course Management</h2>
        <p className="text-sm text-neutral-500">Manage all courses in the academy</p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white">
        {/* Top row: Search + Add */}
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

        {/* Table */}
        <div className="px-3 pb-3 sm:px-4 sm:pb-4">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-separate border-spacing-0">
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
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-neutral-500">Loading…</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-neutral-500">No courses found.</td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c.id} className="border-b border-neutral-200 last:border-0">
                      <Td className="font-medium text-neutral-900">{c.title}</Td>
                      <Td>{pretty(c.category)}</Td>
                      <Td>{c.duration || '-'}</Td>
                      <Td>{c.noOfStudents ?? (c.students ? c.students.length : 0)}</Td>
                      <Td>{c.instructors?.[0]?.fullName ?? '-'}</Td>
                      <Td>
                        {/* exact badge look: blue "Active", grey "Draft" */}
                        {isDraft(c) ? (
                          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">Draft</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-[#0B5CD7] px-2 py-0.5 text-xs text-white">Active</span>
                        )}
                      </Td>
                      <Td className="text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            className="rounded-md p-2 hover:bg-neutral-100"
                            aria-label="Edit"
                            onClick={() => openEdit(c)}
                          >
                            <SquarePen className="h-4 w-4 text-neutral-700" />
                          </button>
                          <button
                            className="rounded-md p-2 hover:bg-neutral-100"
                            aria-label="Delete"
                            onClick={() => setConfirmId(c.id)}
                          >
                            <Trash2 className="h-4 w-4 text-[#FF6A3D]" />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <Modal onClose={() => !working && setModalOpen(false)} title={modalMode === 'create' ? 'Add New Course' : 'Edit Course'}>
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Title">
              <input
                className="input"
                placeholder="Course title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </Field>

            <Field label="Category">
              <Select value={category} onChange={setCategory} placeholder="Select category">
                <Option value="beginner">Beginner</Option>
                <Option value="intermediate">Intermediate</Option>
                <Option value="advanced">Advanced</Option>
              </Select>
            </Field>

            <Field label="Duration">
              <input
                className="input"
                placeholder="e.g., 8 weeks"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                required
              />
            </Field>

            <Field label="Description">
              <textarea
                className="input min-h-[112px] resize-y"
                placeholder="Course description"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </Field>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={working}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={working}>
                {modalMode === 'create' ? 'Create Course' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Delete */}
      {confirmId && (
        <Modal onClose={() => !working && setConfirmId(null)} title="Delete Course">
          <p className="text-sm text-neutral-700">Are you sure you want to delete this course? This action cannot be undone.</p>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button className="btn-secondary" onClick={() => setConfirmId(null)} disabled={working}>Cancel</button>
            <button className="btn-danger" onClick={() => onDelete(confirmId)} disabled={working}>
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ————— Helpers & Presentational Bits ————— */

function isDraft(c: Course) {
  // If your API has an explicit status, use it. Else treat missing instructor as draft for demo display parity
  const status = (c as any).status?.toString().toLowerCase()
  if (status) return status === 'draft'
  return false
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`py-3 text-sm font-semibold ${className}`}>{children}</th>
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-3 text-sm text-neutral-700 ${className}`}>{children}</td>
}
function pretty(v?: string) {
  if (!v) return '-'
  return v.replace(/_/g, ' ').replace(/\b\w/g, m => m.toUpperCase())
}

/* ——— Generic Modal (styled to match your screenshots) ——— */
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
          <div className="p-5">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}

/* ——— Field wrapper ——— */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

/* ——— Minimal select that matches the Figma look ——— */
function Select<T extends string>({
  value, onChange, placeholder, children,
}: { value: T | ''; onChange: (v: T) => void; placeholder?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
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
              const isAct = i === active
              return (
                <li
                  key={v}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => { e.preventDefault(); onChange(v); setOpen(false) }}
                  className={[
                    'px-3 py-2 cursor-pointer flex items-center justify-between',
                    isAct ? 'bg-cyan-500 text-white' : 'hover:bg-neutral-50',
                    isSel && !isAct ? 'text-neutral-900' : ''
                  ].join(' ')}
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
function Option<T extends string>({ children }: { value: T; children: React.ReactNode }) {
  // only used for typing/structure in <Select>; rendered by Select
  return <>{children}</>
}
