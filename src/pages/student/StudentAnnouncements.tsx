import * as React from 'react'
import { UltraLoader } from '../instructor/_shared/UltraLoader'

export default function StudentAnnouncements() {
  const [loading] = React.useState(false)

  // snapshot matching screenshot
  const items = [
    {
      title: 'Welcome to React Fundamentals',
      from: 'From John Smith - 3 days ago',
      body: "Welcome to the React Fundamentals course! I'm excited to work with you all this semester. Please make sure to review the course syllabus and set up your development environment using the provided guide.",
      course: 'React Fundamentals',
    },
    {
      title: 'Assignment 2 Due Date Extended',
      from: 'From John Smith - 1 day ago',
      body: 'Due to the complexity of the React Component Design assignment, I\'m extending the due date to August 25th. This should give everyone enough time to complete the project thoroughly.',
      course: 'React Fundamentals',
    },
    {
      title: 'Design Thinking Workshop',
      from: 'From Mike Davis - 2 hours ago',
      body: "We'll be having a special design thinking workshop next week on Wednesday. This will be a great opportunity to practice user research methods and ideation techniques. Attendance is optional but highly recommended.",
      course: 'UI/UX Design',
    },
  ]

  return (
    <>
      <div className="space-y-4 max-w-[1100px]">
        <div>
          <h2 className="text-2xl sm:text-[22px] font-semibold text-neutral-900">Announcements</h2>
          <p className="text-sm text-neutral-500">Latest updates from your instructors</p>
        </div>

        <div className="space-y-4">
          {items.map(a => (
            <article key={a.title} className="rounded-2xl border border-neutral-200 bg-white p-5">
              <header className="flex items-center justify-between">
                <h3 className="text-[16px] font-semibold text-neutral-900">{a.title}</h3>
                <span className="inline-flex items-center rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700">
                  {a.course}
                </span>
              </header>
              <p className="mt-1 text-sm text-neutral-500">{a.from}</p>
              <p className="mt-3 text-sm text-neutral-700 whitespace-pre-wrap">{a.body}</p>
            </article>
          ))}
        </div>
      </div>

      <UltraLoader show={loading} label="Loading announcements…" />
    </>
  )
}
