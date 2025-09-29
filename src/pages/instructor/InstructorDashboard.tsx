// src/pages/instructor/InstructorDashboard.tsx
import * as React from 'react'
import { UltraLoader } from './_shared/UltraLoader' // same modern loader used on Admin → Courses
import { BookOpen, Users, ClipboardList, Gauge } from 'lucide-react'

type DashboardApi = {
  totalStudents: number
  totalPendingReviews: number
  classAverage: number | null
  curriculum: Array<{
    courseId: string
    courseName: string
    studentsCount: number
    avgProgress: number
    nextDeadline?: string | null
  }>
  recentActivity: Array<{
    message: string
    timeAgo: string
  }>
}

export function InstructorDashboard() {
  const [loading, setLoading] = React.useState(true)
  const [working, setWorking] = React.useState(false) // reserved for future actions to trigger the same overlay
  const [data, setData] = React.useState<DashboardApi | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    void load()
  }, [])

  async function load() {
    const controller = new AbortController()
    try {
      setLoading(true)
      setError(null)

      const base = import.meta.env.VITE_API_BASE_URL as string
      if (!base) throw new Error('VITE_API_BASE_URL is not set')

      const token =
        localStorage.getItem('access_token') ||
        localStorage.getItem('token') ||
        sessionStorage.getItem('access_token') ||
        ''

      const res = await fetch(`${base}/api/instructor/instructor-dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: controller.signal,
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `Request failed with ${res.status}`)
      }

      const json = (await res.json()) as DashboardApi
      setData(json)
    } catch (e: any) {
      if (e?.name !== 'AbortError') setError(e?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
    return () => controller.abort()
  }

  const ultraBusy = loading || working
  const ultraLabel =
    loading ? 'Loading dashboard…'
    : working ? 'Syncing…'
    : ''

  const activeCourses = data?.curriculum?.length ?? 0
  const totalStudents = data?.totalStudents ?? 0
  const pendingReviews = data?.totalPendingReviews ?? 0

  return (
    <>
      <div className="space-y-6">
        {/* ——— Stats row ——— */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Active Courses"
            value={<Num n={activeCourses} className="text-[#0B5CD7]" />}
            caption="Teaching actively"
            Icon={BookOpen}
          />
          <StatCard
            title="Total Students"
            value={<Num n={totalStudents} className="text-[#0FA958]" />}
            caption="Across all courses"
            Icon={Users}
          />
          <StatCard
            title="Pending Reviews"
            value={<Num n={pendingReviews} className="text-[#E79E2B]" />}
            caption="Assignments to grade"
            Icon={ClipboardList}
          />
          <StatCard
            title="Average Score"
            value={
              <span className="text-[28px] font-semibold text-[#0FA5B4]">
                {formatAverage(data?.classAverage)}
              </span>
            }
            caption="Class average"
            Icon={Gauge}
          />
        </div>

        {/* ——— Two columns ——— */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* My Courses */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="mb-4">
              <div className="text-[16px] font-semibold text-neutral-900">My Courses</div>
              <div className="text-sm text-neutral-500 -mt-0.5">Your assigned courses and progress</div>
            </div>

            {data?.curriculum?.length ? (
              <div className="space-y-6">
                {data.curriculum.map((c) => (
                  <CourseRow
                    key={c.courseId}
                    title={c.courseName}
                    percent={clampPercent(c.avgProgress)}
                    students={`${c.studentsCount} ${c.studentsCount === 1 ? 'student' : 'students'}`}
                    nextDeadline={c.nextDeadline ?? '—'}
                  />
                ))}
              </div>
            ) : (
              <EmptyHint text={loading ? 'Loading…' : 'No assigned courses yet.'} />
            )}
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="mb-4">
              <div className="text-[16px] font-semibold text-neutral-900">Recent Activity</div>
              <div className="text-sm text-neutral-500 -mt-0.5">Latest student submissions and activities</div>
            </div>

            {data?.recentActivity?.length ? (
              <ul className="space-y-5">
                {data.recentActivity.map((a, i) => (
                  <Activity
                    key={i}
                    kind={a.message.toLowerCase().includes('missed deadline') ? 'warn' : 'ok'}
                    title={a.message}
                    meta={a.timeAgo}
                  />
                ))}
              </ul>
            ) : (
              <EmptyHint text={loading ? 'Loading…' : 'No recent activity to show.'} />
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Same ultramodern overlay used elsewhere */}
      <UltraLoader show={ultraBusy} label={ultraLabel} />
    </>
  )
}

/* ————— Bits ————— */

function StatCard({
  title, value, caption, Icon,
}: { title: string; value: React.ReactNode; caption: string; Icon: any }) {
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

function Num({ n, className }: { n: number; className?: string }) {
  return <span className={`text-[28px] font-semibold ${className}`}>{n}</span>
}

function CourseRow({
  title, percent, students, nextDeadline,
}: { title: string; percent: number; students: string; nextDeadline: string | number }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="font-medium text-neutral-900">{title}</div>
        <span className="inline-flex items-center rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700">
          {students}
        </span>
      </div>

      {/* progress bar */}
      <div className="mt-2 h-2 rounded-full bg-[#e5eefc]">
        <div
          className="h-2 rounded-full bg-[#0B5CD7] transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-sm text-neutral-600">
        <span>{percent}% complete</span>
        <span>Next deadline: {nextDeadline}</span>
      </div>
    </div>
  )
}

function Activity({ kind, title, meta }: { kind: 'ok' | 'warn'; title: string; meta: string }) {
  const dot = kind === 'ok' ? 'bg-green-600' : 'bg-amber-500'
  return (
    <li className="flex items-start justify-between">
      <div className="flex items-start gap-3">
        <span className={`mt-1 h-2 w-2 rounded-full ${dot}`} />
        <div>
          <div className="font-medium text-neutral-900">{title}</div>
          <div className="text-sm text-neutral-600">{meta}</div>
        </div>
      </div>
    </li>
  )
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
      {text}
    </div>
  )
}

/* ————— helpers ————— */

function clampPercent(n: number | null | undefined) {
  if (typeof n !== 'number' || Number.isNaN(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

function formatAverage(avg: number | null | undefined) {
  if (avg == null) return '—'
  const n = clampPercent(avg)
  if (n >= 90) return 'A'
  if (n >= 85) return 'A-'
  if (n >= 80) return 'B+'
  if (n >= 75) return 'B'
  if (n >= 70) return 'B-'
  if (n >= 65) return 'C+'
  if (n >= 60) return 'C'
  if (n >= 50) return 'D'
  return 'F'
}

export default InstructorDashboard
