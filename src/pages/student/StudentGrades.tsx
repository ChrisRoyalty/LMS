import * as React from 'react'

export default function StudentGrades() {
  const cards = [
    { title: 'React Fundamentals', grade: 'B+', percent: 68 },
    { title: 'UI/UX Design Principles', grade: 'A-', percent: 45 },
    { title: 'Python Data Science', grade: 'B', percent: 20 },
  ]

  const rows = [
    { a: 'JavaScript ES6 Quiz', course: 'React Fundamentals', grade: 'A',  score: '92/100', date: '2024-08-10' },
    { a: 'Wireframe Exercise',  course: 'UI/UX Design Principles', grade: 'A-', score: '88/100', date: '2024-08-08' },
    { a: 'Component Basics',    course: 'React Fundamentals', grade: 'B+', score: '85/100', date: '2024-08-05' },
    { a: 'Data Cleaning Lab',   course: 'Python Data Science', grade: 'B',  score: '82/100', date: '2024-08-03' },
    { a: 'Design System Analysis', course: 'UI/UX Design Principles', grade: 'B+', score: '87/100', date: '2024-08-01' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl sm:text-[22px] font-semibold text-neutral-900">Grades & Progress</h2>
        <p className="text-sm text-neutral-500">Track your academic performance and progress</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.title} className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="text-[16px] font-semibold text-neutral-900">{c.title}</div>
            <div className="mt-1 text-sm text-neutral-500">Current Grade</div>
            <div className="mt-2 text-[28px] font-semibold text-[#0FA5B4]">{c.grade}</div>
            <div className="mt-3 h-2 rounded-full bg-[#e5eefc]">
              <div className="h-2 rounded-full bg-[#0B5CD7]" style={{ width: `${c.percent}%` }} />
            </div>
            <div className="mt-2 text-sm text-neutral-600">{c.percent}% complete</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="mb-3">
          <div className="text-[16px] font-semibold text-neutral-900">Recent Grades</div>
          <div className="text-sm text-neutral-500 -mt-0.5">Your latest assignment and project grades</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-separate border-spacing-0 min-w-[760px]">
            <thead>
              <tr className="text-left text-neutral-700">
                <Th>Assignment</Th>
                <Th>Course</Th>
                <Th>Grade</Th>
                <Th>Score</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx} className="border-b border-neutral-200 last:border-0">
                  <Td className="font-medium text-neutral-900">{r.a}</Td>
                  <Td>{r.course}</Td>
                  <Td>
                    <span className="inline-flex items-center rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700">
                      {r.grade}
                    </span>
                  </Td>
                  <Td>{r.score}</Td>
                  <Td>{r.date}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`py-3 text-sm font-semibold ${className}`}>{children}</th>
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-3 text-sm text-neutral-700 ${className}`}>{children}</td>
}
