import * as React from 'react'
import { Download, Upload, Calendar } from 'lucide-react'
import { UltraLoader } from '../instructor/_shared/UltraLoader'

export default function StudentAssignments() {
  const [tab, setTab] = React.useState<'Pending'|'Submitted'|'Graded'|'All'>('Pending')
  const [loading] = React.useState(false)

  const items = [
    { title: 'React Component Design', course: 'React Fundamentals', type: 'Assignment', due: '2024-08-20', status: 'Pending' },
    { title: 'State Management Project', course: 'React Fundamentals', type: 'Project',   due: '2024-08-25', status: 'In Progress' },
    { title: 'Data Analysis Capstone',  course: 'Python Data Science', type: 'Capstone',  due: '2024-09-15', status: 'Not Started' },
  ]

  const visible = tab === 'All' ? items : items.filter(i => (
    tab === 'Pending' && (i.status === 'Pending' || i.status === 'In Progress' || i.status === 'Not Started')
    || tab === 'Submitted' && false
    || tab === 'Graded' && false
  ))

  return (
    <>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl sm:text-[22px] font-semibold text-neutral-900">Assignments & Projects</h2>
          <p className="text-sm text-neutral-500">Track your assignments and project deadlines</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {(['Pending','Submitted','Graded','All'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                'inline-flex items-center rounded-full border px-3 py-1 text-xs',
                tab === t ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 bg-white text-neutral-700'
              ].join(' ')}
            >
              {t}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-4">
          {visible.map(a => (
            <article key={a.title} className="rounded-2xl border border-neutral-200 bg-white p-5">
              <header className="flex items-start justify-between">
                <div>
                  <div className="text-[16px] font-semibold text-neutral-900">{a.title}</div>
                  <div className="text-sm text-neutral-600">{a.course}</div>
                  <div className="mt-2 flex items-center gap-3 text-sm text-neutral-700">
                    <span className="inline-flex items-center rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700">
                      {a.type}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> Due: {a.due}
                    </span>
                  </div>
                </div>
                <span className={[
                  'inline-flex items-center rounded-full border px-2 py-0.5 text-xs',
                  a.status === 'Pending'     ? 'border-amber-200 bg-amber-50 text-amber-700' :
                  a.status === 'In Progress' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                  'border-neutral-300 bg-neutral-50 text-neutral-700'
                ].join(' ')}
                >
                  {a.status}
                </span>
              </header>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-50">
                  <Download className="h-4 w-4" /> Download
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl bg-[#0B5CD7] px-3 py-2 text-sm text-white hover:brightness-95">
                  <Upload className="h-4 w-4" /> Submit
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <UltraLoader show={loading} label="Loading assignments…" />
    </>
  )
}
