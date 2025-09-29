import * as React from 'react'
import { UltraLoader } from '../instructor/_shared/UltraLoader'
import { BookOpen, Gauge } from 'lucide-react'

type CourseRowT = {
  title: string
  percent: number
  nextDeadline: string
  grade?: string
}

type DeadlineT = {
  title: string
  course: string
  due: string
  status: 'Pending' | 'In Progress' | 'Not Started'
}

type ActivityT = {
  icon: 'check' | 'upload' | 'alert'
  title: string
  sub: string
  ago: string
}

export default function StudentDashboard() {
  const [loading, setLoading] = React.useState(false)

  // exact items from the screenshot (can later hydrate from API)
  const courses: CourseRowT[] = [
    { title: 'React Fundamentals',       percent: 68, nextDeadline: '2024-08-20', grade: 'B+' },
    { title: 'UI/UX Design Principles',  percent: 45, nextDeadline: '2024-08-25', grade: 'A-' },
    { title: 'Python Data Science',      percent: 20, nextDeadline: '2024-08-30', grade: 'B'  },
  ]
  const deadlines: DeadlineT[] = [
    { title: 'React Component Design', course: 'React Fundamentals', due: '2024-08-20', status: 'Pending' },
    { title: 'State Management Project', course: 'React Fundamentals', due: '2024-08-25', status: 'In Progress' },
  ]
  const activity: ActivityT[] = [
    { icon: 'check',  title: 'Received grade for User Research Report', sub: 'UI/UX Design Principles · Grade: A-', ago: '2 hours ago' },
    { icon: 'upload', title: 'Submitted State Management Project',      sub: 'React Fundamentals · Awaiting review', ago: '1 day ago' },
    { icon: 'alert',  title: 'New assignment posted',                   sub: 'React Component Design · Due Aug 20',  ago: '2 days ago' },
  ]

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Course Progress */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="mb-4">
            <div className="text-[16px] font-semibold text-neutral-900">Course Progress</div>
            <div className="text-sm text-neutral-500 -mt-0.5">Your progress across all enrolled courses</div>
          </div>

          <div className="space-y-6">
            {courses.map((c) => (
              <div key={c.title}>
                <div className="flex items-center justify-between">
                  <div className="font-medium text-neutral-900">{c.title}</div>
                  {c.grade && (
                    <span className="inline-flex items-center rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700">
                      {c.grade}
                    </span>
                  )}
                </div>
                <div className="mt-2 h-2 rounded-full bg-[#e5eefc]">
                  <div className="h-2 rounded-full bg-[#0B5CD7]" style={{ width: `${c.percent}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-neutral-600">
                  <span>{c.percent}% complete</span>
                  <span>Next: {c.nextDeadline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="mb-4">
            <div className="text-[16px] font-semibold text-neutral-900">Upcoming Deadlines</div>
            <div className="text-sm text-neutral-500 -mt-0.5">Your next assignment deadlines</div>
          </div>

          <ul className="space-y-5">
            {deadlines.map((d) => (
              <li key={d.title} className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[#0B5CD7]" />
                  <div>
                    <div className="font-medium text-neutral-900">{d.title}</div>
                    <div className="text-sm text-neutral-600">{d.course} · Due {d.due}</div>
                  </div>
                </div>
                <span className={[
                    'inline-flex items-center rounded-full border px-2 py-0.5 text-xs',
                    d.status === 'Pending' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                    d.status === 'In Progress' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                    'border-neutral-300 bg-neutral-50 text-neutral-700'
                  ].join(' ')}
                >
                  {d.status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent Activity (full width under) */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="mb-4">
            <div className="text-[16px] font-semibold text-neutral-900">Recent Activity</div>
            <div className="text-sm text-neutral-500 -mt-0.5">Your latest grades and submissions</div>
          </div>

          <div className="divide-y divide-neutral-200">
            {activity.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-4">
                <div className="flex items-start gap-3">
                  <IconDot kind={a.icon} />
                  <div>
                    <div className="font-medium text-neutral-900">{a.title}</div>
                    <div className="text-sm text-neutral-600">{a.sub}</div>
                  </div>
                </div>
                <div className="text-sm text-neutral-500">{a.ago}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <UltraLoader show={loading} label="Loading dashboard…" />
    </>
  )
}

function IconDot({ kind }: { kind: 'check' | 'upload' | 'alert' }) {
  const color =
    kind === 'check' ? 'bg-green-600' :
    kind === 'upload' ? 'bg-cyan-600' : 'bg-amber-500'
  return <span className={`mt-2 h-2 w-2 rounded-full ${color}`} />
}
