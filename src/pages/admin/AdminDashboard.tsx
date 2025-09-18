// src/pages/admin/AdminDashboard.tsx
import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Users, UserCheck, Layers } from 'lucide-react'
import { api } from '../../lib/api'
import { showToast } from '../../lib/toast'
import { AdminDashboardPayload } from '../../lib/types'

export function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    api.get<AdminDashboardPayload>('/api/dashboard/admin-dashboard')
      .then(({ data }) => { if (mounted) setData(data) })
      .catch((err) => {
        if (mounted) setData(null)
        showToast({
          kind: 'error',
          title: 'Failed to load dashboard',
          message: err?.response?.data?.message || 'Please try again.',
        })
      })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const topCourses = data?.topCourses || []

  const recent = useMemo(() => {
    const students: { name: string; course: string; createdAt?: string }[] = []
    if (topCourses?.length) {
      for (const c of topCourses) {
        for (const s of c.students || []) {
          students.push({ name: s.fullName, course: c.title, createdAt: (s as any)?.UserCourse?.createdAt })
        }
      }
    }
    return students
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 4)
  }, [topCourses])

  const ultraBusy = loading

  return (
    <>
      <div className="relative space-y-6">
        {/* Exact same ultra loader pattern as in Courses */}
        <UltraLoader show={ultraBusy} label="Loading dashboard…" />

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkCard key={i} />)
          ) : (
            <>
              <StatCard
                title="Total Courses"
                value={<span className="text-[28px] font-semibold text-[#0B5CD7]">{nf(data?.totalCourses)}</span>}
                caption="+2 from last month"
                Icon={BookOpen}
              />
              <StatCard
                title="Total Students"
                value={<span className="text-[28px] font-semibold text-green-600">{nf(data?.totalStudents)}</span>}
                caption="+12 from last month"
                Icon={Users}
              />
              <StatCard
                title="Active Instructors"
                value={<span className="text-[28px] font-semibold text-[#0B5CD7]">{nf(data?.totalInstructors)}</span>}
                caption="All instructors active"
                Icon={UserCheck}
              />
              <StatCard
                title="Active Batches"
                value={<span className="text-[28px] font-semibold text-amber-500">{nf((data as any)?.activeBatches)}</span>}
                caption="Running cohorts"
                Icon={Layers}
              />
            </>
          )}
        </div>

        {/* Two-column panels */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Recent Enrollments */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="mb-4">
              <div className="text-[16px] font-semibold text-neutral-900">Recent Enrollments</div>
              <div className="text-sm text-neutral-500 -mt-0.5">Latest student course enrollments</div>
            </div>

            {loading ? (
              <SkPanel />
            ) : recent.length === 0 ? (
              <div className="text-sm text-neutral-500">No recent enrollments.</div>
            ) : (
              <ul className="space-y-5">
                {recent.map((r, i) => (
                  <li key={i} className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-green-600" />
                      <div>
                        <div className="font-medium text-neutral-900">{r.name}</div>
                        <div className="text-sm text-neutral-600">Enrolled in {r.course}</div>
                      </div>
                    </div>
                    <Pill label="New" tone="neutral" />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Course Performance */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="mb-4">
              <div className="text-[16px] font-semibold text-neutral-900">Course Performance</div>
              <div className="text-sm text-neutral-500 -mt-0.5">Top performing courses this month</div>
            </div>

            {loading ? (
              <SkPanel />
            ) : topCourses.length === 0 ? (
              <div className="text-sm text-neutral-500">No course data yet.</div>
            ) : (
              <ul className="space-y-5">
                {topCourses.map((c) => (
                  <li key={c.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-neutral-900 leading-tight">{c.title}</div>
                      <div className="text-sm text-neutral-600">
                        {c.studentCount} {c.studentCount === 1 ? 'student' : 'students'}
                      </div>
                    </div>
                    <Pill label="Active" tone="success" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

/* ————— UI bits ————— */

function nf(n?: number) { return typeof n === 'number' ? n : 0 }

function Pill({ label, tone }: { label: string; tone: 'neutral' | 'success' | 'warning' }) {
  const styles =
    tone === 'success'
      ? 'border-green-200 bg-green-50 text-green-700'
      : tone === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-neutral-300 bg-white text-neutral-700'
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${styles}`}>{label}</span>
}

function StatCard({
  title, value, caption, Icon,
}: { title: string; value: React.ReactNode; caption: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }) {
  return (
    <div className="relative rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="text-sm font-medium text-neutral-800">{title}</div>
        <div className="h-8 w-8 rounded-md bg-white text-neutral-400 grid place-items-center border border-neutral-200">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4">{value}</div>
      <div className="mt-1 text-sm text-neutral-500">{caption}</div>
    </div>
  )
}

/* ————— Skeletons (kept same structure; overlay will sit above while loading) ————— */
function SkCard() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="h-4 w-28 rounded bg-neutral-200 animate-pulse" />
      <div className="mt-4 h-7 w-20 rounded bg-neutral-200 animate-pulse" />
      <div className="mt-2 h-4 w-32 rounded bg-neutral-200 animate-pulse" />
    </div>
  )
}

function SkPanel() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="mb-4 space-y-2">
        <div className="h-4 w-44 rounded bg-neutral-200 animate-pulse" />
        <div className="h-3 w-56 rounded bg-neutral-200 animate-pulse" />
      </div>
      <ul className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-40 rounded bg-neutral-200 animate-pulse" />
              <div className="h-3 w-28 rounded bg-neutral-200 animate-pulse" />
            </div>
            <div className="h-6 w-16 rounded-full bg-neutral-200 animate-pulse" />
          </li>
        ))}
      </ul>
    </div>
  )
}

/* — Ultra loader (same look/behavior as in Courses) — */
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
