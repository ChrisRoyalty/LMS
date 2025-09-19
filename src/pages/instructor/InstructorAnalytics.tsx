export default function InstructorAnalytics() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Student Performance Distribution" subtitle="Grade distribution across all students">
          <ListBar label="A+ (90-100%)" value={15} />
          <ListBar label="A (85-89%)" value={25} />
          <ListBar label="B+ (80-84%)" value={30} />
          <ListBar label="B (75-79%)" value={20} />
          <ListBar label="C (70-74%)" value={10} />
        </Panel>
        <Panel title="Assignment Completion Rates" subtitle="Completion rates by assignment type">
          <ListBar label="Quizzes" value={95} />
          <ListBar label="Assignments" value={88} />
          <ListBar label="Projects" value={75} />
          <ListBar label="Capstone" value={60} />
        </Panel>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="mb-4">
          <div className="text-[16px] font-semibold text-neutral-900">Student Progress Tracking</div>
          <div className="text-sm text-neutral-500 -mt-0.5">Individual student progress in your courses</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] table-fixed border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-neutral-700">
                <Th>Student</Th><Th>Course</Th><Th>Assignments Completed</Th><Th>Average Score</Th><Th>Trend</Th><Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {[
                { name:'Alice Cooper',  course:'React Fundamentals', comp:70,  score:'A',  trend:'↗', status:'Active' },
                { name:'Bob Wilson',    course:'React Fundamentals', comp:45,  score:'B+', trend:'↗', status:'Active' },
                { name:'Charlie Brown', course:'Advanced JavaScript', comp:35,  score:'C',  trend:'↗', status:'Behind' },
                { name:'Diana Prince',  course:'React Fundamentals', comp:80,  score:'A+', trend:'↗', status:'Active' },
              ].map((r,i)=>(
                <tr key={i} className="border-b border-neutral-200 last:border-0">
                  <Td className="font-medium text-neutral-900">{r.name}</Td>
                  <Td>{r.course}</Td>
                  <Td>
                    <div className="h-2 w-48 rounded-full bg-neutral-200 overflow-hidden">
                      <div className="h-2 rounded-full bg-[#0B5CD7]" style={{ width:`${r.comp}%` }} />
                    </div>
                  </Td>
                  <Td><Badge label={r.score} tone="neutral" /></Td>
                  <Td>📈</Td>
                  <Td>{r.status==='Active'?<Badge label="Active" tone="primary" />:<Badge label="Behind" tone="warning" />}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
function Panel({ title, subtitle, children }: any) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="mb-4">
        <div className="text-[16px] font-semibold text-neutral-900">{title}</div>
        <div className="text-sm text-neutral-500 -mt-0.5">{subtitle}</div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}
function ListBar({ label, value }: { label:string; value:number }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="text-sm text-neutral-800">{label}</div>
      <div className="flex items-center gap-3">
        <div className="h-2 w-48 rounded-full bg-neutral-200 overflow-hidden">
          <div className="h-2 rounded-full bg-[#0B5CD7]" style={{ width:`${value}%` }} />
        </div>
        <span className="text-sm text-neutral-700">{value}%</span>
      </div>
    </div>
  )
}
function Th({ children }: { children:React.ReactNode }) { return <th className="py-3 text-sm font-semibold">{children}</th> }
function Td({ children, className='' }: { children:React.ReactNode; className?:string }) { return <td className={`py-3 text-sm text-neutral-700 ${className}`}>{children}</td> }
function Badge({ label, tone='primary' }: { label:string; tone?:'primary'|'neutral'|'warning' }) {
  const map = { primary:'bg-[#0B5CD7] text-white', neutral:'bg-neutral-100 text-neutral-800', warning:'bg-amber-100 text-amber-800' } as const
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${map[tone]}`}>{label}</span>
}
