import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Users, UserCheck, TrendingUp } from 'lucide-react'
import { api } from '../../lib/api'
import { AdminDashboardPayload, AdminDashboardStudent } from '../../lib/types'

export function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardPayload | null>(null)

  useEffect(() => {
    let mounted = true
    api.get<AdminDashboardPayload>('/api/dashboard/admin-dashboard')
      .then(({ data }) => { if (mounted) setData(data) })
      .catch(() => { if (mounted) setData(null) })
    return () => { mounted = false }
  }, [])

  const recent = useMemo(() => {
    const students: { name: string; course: string; createdAt?: string }[] = []
    if (data?.topCourses) {
      for (const c of data.topCourses) {
        for (const s of c.students || []) {
          students.push({ name: s.fullName, course: c.title, createdAt: s.UserCourse?.createdAt || undefined })
        }
      }
    }
    return students
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 4)
  }, [data])

  const topCourses = data?.topCourses || []

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Courses"      value={<span className="text-[28px] font-semibold text-[#0B5CD7]">{data?.totalCourses ?? 0}</span>} caption="+2 from last month" Icon={BookOpen} />
        <StatCard title="Total Students"     value={<span className="text-[28px] font-semibold text-green-600">{data?.totalStudents ?? 0}</span>} caption="+12 from last month" Icon={Users} />
        <StatCard title="Active Instructors" value={<span className="text-[28px] font-semibold text-[#0B5CD7]">{data?.totalInstructors ?? 0}</span>} caption="All instructors active" Icon={UserCheck} />
        <StatCard title="Completion Rate"    value={<span className="text-[28px] font-semibold text-amber-500">{0}%</span>} caption="+5% from last month" Icon={TrendingUp} />
      </div>

      {/* Two-column panels */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Enrollments */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="mb-4">
            <div className="text-[16px] font-semibold text-neutral-900">Recent Enrollments</div>
            <div className="text-sm text-neutral-500 -mt-0.5">Latest student course enrollments</div>
          </div>

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
            {recent.length === 0 && (
              <div className="text-sm text-neutral-500">No recent enrollments.</div>
            )}
          </ul>
        </div>

        {/* Course Performance */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="mb-4">
            <div className="text-[16px] font-semibold text-neutral-900">Course Performance</div>
            <div className="text-sm text-neutral-500 -mt-0.5">Top performing courses this month</div>
          </div>

          <ul className="space-y-5">
            {topCourses.map((c) => (
              <li key={c.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-neutral-900 leading-tight">{c.title}</div>
                  <div className="text-sm text-neutral-600">{c.studentCount} {c.studentCount === 1 ? 'student' : 'students'}</div>
                </div>
                <Pill label="Active" tone="success" />
              </li>
            ))}
            {topCourses.length === 0 && <div className="text-sm text-neutral-500">No course data yet.</div>}
          </ul>
        </div>
      </div>
    </div>
  )
}

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
