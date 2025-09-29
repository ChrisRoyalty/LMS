import * as React from 'react'
import { Play } from 'lucide-react'

export default function StudentCourses() {
  const cards = [
    { title: 'React Fundamentals',       instructor: 'John Smith',  percent: 68, grade: 'B+', deadline: '2024-08-20' },
    { title: 'UI/UX Design Principles',  instructor: 'Mike Davis',  percent: 45, grade: 'A-', deadline: '2024-08-25' },
    { title: 'Python Data Science',      instructor: 'Emily Chen',  percent: 20, grade: 'B',  deadline: '2024-08-30' },
  ]
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl sm:text-[22px] font-semibold text-neutral-900">My Courses</h2>
        <p className="text-sm text-neutral-500">Courses you're currently enrolled in</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3 md:grid-cols-2">
        {cards.map((c) => (
          <div key={c.title} className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[16px] font-semibold text-neutral-900">{c.title}</div>
                <div className="text-sm text-neutral-600">Instructor: {c.instructor}</div>
              </div>
              <span className="inline-flex items-center rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700">
                {c.grade}
              </span>
            </div>

            <div className="mt-4">
              <div className="text-sm font-medium text-neutral-700">Progress</div>
              <div className="mt-2 h-2 rounded-full bg-[#e5eefc]">
                <div className="h-2 rounded-full bg-[#0B5CD7]" style={{ width: `${c.percent}%` }} />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-neutral-600">
              <span>Next deadline:</span>
              <span className="text-neutral-800">{c.deadline}</span>
            </div>

            <button className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-800 hover:bg-neutral-50">
              <Play className="h-4 w-4" />
              Continue Learning
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
