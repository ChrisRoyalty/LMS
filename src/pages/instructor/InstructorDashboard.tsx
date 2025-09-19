// src/pages/instructor/InstructorDashboard.tsx
import { UltraLoader } from './_shared/UltraLoader'
import { BookOpen, Users, ClipboardList, Gauge } from 'lucide-react'

export function InstructorDashboard() {
  // static snapshot UI (no API calls yet)
  const loading = false

  return (
    <>
      <div className="space-y-6">
        {/* ——— Stats row ——— */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Active Courses"
            value={<Num n={2} className="text-[#0B5CD7]" />}
            caption="Teaching actively"
            Icon={BookOpen}
          />
          <StatCard
            title="Total Students"
            value={<Num n={4} className="text-[#0FA958]" />}
            caption="Across all courses"
            Icon={Users}
          />
          <StatCard
            title="Pending Reviews"
            value={<Num n={12} className="text-[#E79E2B]" />}
            caption="Assignments to grade"
            Icon={ClipboardList}
          />
          <StatCard
            title="Average Score"
            value={<span className="text-[28px] font-semibold text-[#0FA5B4]">B+</span>}
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

            <CourseRow
              title="React Fundamentals"
              percent={68}
              students="25 students"
              nextDeadline="2024-08-20"
            />

            <div className="mt-6" />

            <CourseRow
              title="Advanced JavaScript"
              percent={45}
              students="18 students"
              nextDeadline="2024-08-25"
            />
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="mb-4">
              <div className="text-[16px] font-semibold text-neutral-900">Recent Activity</div>
              <div className="text-sm text-neutral-500 -mt-0.5">Latest student submissions and activities</div>
            </div>

            <ul className="space-y-5">
              <Activity
                kind="ok"
                title="Alice Cooper submitted assignment"
                meta="React Component Design · 2 hours ago"
              />
              <Activity
                kind="warn"
                title="Charlie Brown missed deadline"
                meta="JavaScript ES6 Quiz · 1 day ago"
              />
              <Activity
                kind="ok"
                title="Bob Wilson submitted project"
                meta="State Management Project · 3 hours ago"
              />
            </ul>
          </div>
        </div>
      </div>

      {/* same loader shell for consistency — stays hidden here */}
      <UltraLoader show={loading} label="Loading dashboard…" />
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
}: { title: string; percent: number; students: string; nextDeadline: string }) {
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
  const dot =
    kind === 'ok'
      ? 'bg-green-600'
      : 'bg-amber-500'

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

export default InstructorDashboard
