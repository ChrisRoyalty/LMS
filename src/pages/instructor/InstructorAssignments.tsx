import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Eye, SquarePen, Trash2, Check, ChevronDown, X } from 'lucide-react'
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
type Submission = {
  id: string
  assignmentId: string
  studentId: string
  submissionLink: string
  status: 'PENDING' | 'GRADED'
  score?: number
  feedback?: string
}

export default function InstructorAssignments() {
  // data
  const [courses, setCourses] = useState<Course[]>([])
  const [rows, setRows] = useState<Assignment[]>([])
  const [query, setQuery] = useState('')

  // modals
  const [createOpen, setCreateOpen] = useState(false)
  const [gradeOpen, setGradeOpen] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)

  // working flags
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)

  // create form
  const [cTitle, setCTitle] = useState('')
  const [cCourseId, setCCourseId] = useState('')
  const [cType, setCType] = useState<'ASSIGNMENT' | 'QUIZ' | 'PROJECT' | 'CAPSTONE' | ''>('')
  const [cDeadline, setCDeadline] = useState('')
  const [cDesc, setCDesc] = useState('')
  const [cMax, setCMax] = useState<number | ''>('')

  // submit form (demo/test)
  const [sAssignmentId, setSAssignmentId] = useState('')
  const [sLink, setSLink] = useState('')

  // grade form
  const [gSubmissionId, setGSubmissionId] = useState('')
  const [gScore, setGScore] = useState<number | ''>('')
  const [gFeedback, setGFeedback] = useState('')

  // load courses; (no list endpoint provided for assignments — we’ll keep a local list & append created items)
  useEffect(() => {
    setLoading(true)
    api.get('/api/courses/all-courses')
      .then(({ data }) => {
        const list: Course[] = Array.isArray(data) ? data.map((c: any) => ({ id: c.id, title: c.title })) : []
        setCourses(list)
      })
      .catch((e) => {
        showToast({ kind: 'error', title: 'Could not load courses', message: e?.response?.data?.message || 'Please try again.' })
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r =>
      [r.title, r.courseTitle, r.assignmentType, r.deadline].filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q))
    )
  }, [rows, query])

  /* ------------ create assignment ------------ */
  const openCreate = () => {
    setCTitle(''); setCCourseId(''); setCType(''); setCDeadline(''); setCDesc(''); setCMax('')
    setCreateOpen(true)
  }
  async function onCreate(e: React.FormEvent) {
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
        deadline: cDeadline,
        maxScore: typeof cMax === 'number' ? cMax : undefined,
        assignmentType: cType || undefined,
      }
      const { data } = await api.post('/api/assignments/create-assignment', payload)
      const created = data?.assignment as any
      const courseTitle = courses.find(c => c.id === created?.courseId)?.title
      setRows(prev => [
        {
          id: created?.id,
          title: created?.title,
          description: created?.description,
          courseId: created?.courseId,
          courseTitle,
          deadline: (created?.deadline || '').slice(0, 10),
          maxScore: created?.maxScore,
          assignmentType: created?.assignmentType,
          status: 'Active',
          submissions: 0,
        },
        ...prev,
      ])
      showToast({ kind: 'success', title: 'Assignment created', message: data?.message || 'Saved successfully.' })
      setCreateOpen(false)
    } catch (e: any) {
      showToast({ kind: 'error', title: 'Create failed', message: e?.response?.data?.message || 'Please try again.' })
    } finally { setWorking(false) }
  }

  /* ------------ (demo) submit assignment ------------ */
  const openSubmit = (assignmentId?: string) => {
    setSAssignmentId(assignmentId || '')
    setSLink('')
    setSubmitOpen(true)
  }
  async function onSubmitAssignment(e: React.FormEvent) {
    e.preventDefault()
    if (!sAssignmentId || !sLink) {
      showToast({ kind: 'warning', title: 'Missing fields', message: 'Provide an assignment and a link.' })
      return
    }
    setWorking(true)
    try {
      const { data } = await api.post(`/api/submit/submit-assignment/${sAssignmentId}`, { submissionLink: sLink })
      showToast({ kind: 'success', title: 'Submitted', message: data?.message || 'Submission successful.' })
      setSubmitOpen(false)
    } catch (e: any) {
      showToast({ kind: 'error', title: 'Submit failed', message: e?.response?.data?.message || 'Please try again.' })
    } finally { setWorking(false) }
  }

  /* ------------ grade submission ------------ */
  const openGrade = (submissionId?: string) => {
    setGSubmissionId(submissionId || '')
    setGScore(''); setGFeedback('')
    setGradeOpen(true)
  }
  async function onGrade(e: React.FormEvent) {
    e.preventDefault()
    if (!gSubmissionId || gScore === '' || Number.isNaN(Number(gScore))) {
      showToast({ kind: 'warning', title: 'Missing fields', message: 'Provide a valid score (number).' })
      return
    }
    setWorking(true)
    try {
      const { data } = await api.post(`/api/submit/grade/${gSubmissionId}`, { score: Number(gScore), feedback: gFeedback || undefined })
      showToast({ kind: 'success', title: 'Graded', message: data?.message || 'Submission graded.' })
      setGradeOpen(false)
    } catch (e: any) {
      showToast({ kind: 'error', title: 'Grade failed', message: e?.response?.data?.message || 'Please try again.' })
    } finally { setWorking(false) }
  }

  const ultraBusy = loading || working

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
          {/* Filters row (search + faux tabs look) */}
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
                  {loading ? (
                    <SkRows cols={7} rows={5} />
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} className="py-10 text-center text-neutral-500">No assignments yet.</td></tr>
                  ) : (
                    filtered.map(a => (
                      <tr key={a.id} className="border-b border-neutral-200 last:border-0">
                        <Td className="font-medium text-neutral-900">{a.title}</Td>
                        <Td>{a.courseTitle || courses.find(c=>c.id===a.courseId)?.title || '-'}</Td>
                        <Td>{prettyType(a.assignmentType)}</Td>
                        <Td>{a.deadline ? a.deadline : '-'}</Td>
                        <Td>{a.submissions ?? 0}</Td>
                        <Td>
                          {a.status === 'Active'
                            ? <span className="inline-flex items-center rounded-full bg-[#0B5CD7] px-2 py-0.5 text-xs text-white">Active</span>
                            : a.status === 'Completed'
                              ? <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">Completed</span>
                              : <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">Draft</span>}
                        </Td>
                        <Td className="text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button className="rounded-md p-2 hover:bg-neutral-100" title="View / Submit (demo)" onClick={() => openSubmit(a.id)}>
                              <Eye className="h-4 w-4 text-neutral-700" />
                            </button>
                            <button className="rounded-md p-2 hover:bg-neutral-100" title="Grade (demo)" onClick={() => openGrade('b1fa6291-d6c9-4f6f-935d-8b7f0b5c14f2')}>
                              <SquarePen className="h-4 w-4 text-neutral-700" />
                            </button>
                            <button className="rounded-md p-2 hover:bg-neutral-100" title="Delete (local)" onClick={() => setRows(rs => rs.filter(x => x.id !== a.id))}>
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
      </div>

      {/* Create Assignment Modal */}
      {createOpen && (
        <Modal title="Create New Assignment" subtext="Create a new assignment for your students" onClose={() => !working && setCreateOpen(false)}>
          <form onSubmit={onCreate} className="space-y-4">
            <Field label="Title">
              <input className="input" placeholder="Assignment title" value={cTitle} onChange={e => setCTitle(e.target.value)} required />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Course">
                <HeadlessSelect
                  value={cCourseId}
                  onChange={setCCourseId}
                  placeholder="Select course"
                  options={courses.map(c => ({ value: c.id, label: c.title }))}
                />
              </Field>

              <Field label="Type">
                <HeadlessSelect
                  value={cType}
                  onChange={(v) => setCType(v as any)}
                  placeholder="Assignment type"
                  options={[
                    { value: 'ASSIGNMENT', label: 'Assignment' },
                    { value: 'PROJECT',    label: 'Project' },
                    { value: 'QUIZ',       label: 'Quiz' },
                    { value: 'CAPSTONE',   label: 'Capstone' },
                  ]}
                />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Due Date">
                <input className="input" type="date" value={cDeadline} onChange={e => setCDeadline(e.target.value)} required />
              </Field>
              <Field label="Max Score">
                <input className="input" type="number" min={0} placeholder="e.g., 100" value={cMax} onChange={e => setCMax(e.target.value === '' ? '' : Number(e.target.value))} />
              </Field>
            </div>

            <Field label="Description">
              <textarea className="input min-h-[112px] resize-y" placeholder="Assignment instructions and requirements" value={cDesc} onChange={e => setCDesc(e.target.value)} />
            </Field>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setCreateOpen(false)} disabled={working}>Cancel</button>
              <button type="submit" className="btn-primary rounded-lg p-2" disabled={working}>Create Assignment</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Demo Submit Modal */}
      {submitOpen && (
        <Modal title="Submit Assignment (Demo)" onClose={() => !working && setSubmitOpen(false)}>
          <form onSubmit={onSubmitAssignment} className="space-y-4">
            <Field label="Assignment">
              <HeadlessSelect
                value={sAssignmentId}
                onChange={setSAssignmentId}
                placeholder="Select assignment"
                options={rows.map(r => ({ value: r.id, label: r.title }))}
              />
            </Field>
            <Field label="Submission Link">
              <input className="input" placeholder="https://github.com/…" value={sLink} onChange={e => setSLink(e.target.value)} required />
            </Field>
            <div className="flex items-center justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setSubmitOpen(false)} disabled={working}>Cancel</button>
              <button type="submit" className="btn-primary rounded-lg p-2" disabled={working}>Submit</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Grade Modal */}
      {gradeOpen && (
        <Modal title="Grade Submission" onClose={() => !working && setGradeOpen(false)}>
          <form onSubmit={onGrade} className="space-y-4">
            <Field label="Submission ID">
              <input className="input" placeholder="b1fa6291-… (demo)" value={gSubmissionId} onChange={e => setGSubmissionId(e.target.value)} required />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Score">
                <input className="input" type="number" min={0} placeholder="e.g., 85" value={gScore} onChange={e => setGScore(e.target.value === '' ? '' : Number(e.target.value))} required />
              </Field>
              <Field label="Feedback">
                <input className="input" placeholder="Optional feedback" value={gFeedback} onChange={e => setGFeedback(e.target.value)} />
              </Field>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setGradeOpen(false)} disabled={working}>Cancel</button>
              <button type="submit" className="btn-primary rounded-lg p-2" disabled={working}>Save Grade</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Ultra loader (same shared look) */}
      <UltraLoader
        show={ultraBusy}
        label={
          loading ? 'Loading…' :
          working && createOpen   ? 'Creating assignment…' :
          working && submitOpen   ? 'Submitting…' :
          working && gradeOpen    ? 'Saving grade…' : ''
        }
      />
    </>
  )
}

/* ————— Presentational helpers ————— */
function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs text-neutral-700">{children}</span>
}
function prettyType(t?: Assignment['assignmentType']) {
  if (!t) return '-'
  const m: any = { ASSIGNMENT:'Assignment', QUIZ:'Quiz', PROJECT:'Project', CAPSTONE:'Capstone' }
  return m[t] || t
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

/* ————— Modal (portal; full-viewport blur) ————— */
function Modal({
  onClose, title, subtext, children,
}: { onClose: () => void; title: string; subtext?: string; children: React.ReactNode }) {
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
      <div className="fixed inset-0 z-[10000] h-screen w-screen bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
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

/* ————— Field & Headless Select ————— */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}
function HeadlessSelect<T extends string>({
  value, onChange, placeholder, options,
}: {
  value: T | ''
  onChange: (v: T) => void
  placeholder?: string
  options: { value: T; label: string }[]
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button type="button" className="input w-full text-left pr-10" onClick={() => setOpen(o => !o)}>
        {value ? (options.find(o => o.value === value)?.label ?? '') : <span className="text-neutral-400">{placeholder || 'Select…'}</span>}
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-2 z-20 rounded-xl border border-neutral-200 bg-white shadow-lg overflow-hidden">
          <ul className="py-1 max-h-60 overflow-auto">
            {options.map((opt) => {
              const isSel = opt.value === value
              return (
                <li
                  key={opt.value}
                  onMouseDown={(e) => { e.preventDefault(); onChange(opt.value); setOpen(false) }}
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

/* ————— Ultra Loader (shared look) ————— */
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
