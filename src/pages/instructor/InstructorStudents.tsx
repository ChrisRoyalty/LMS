import { useEffect, useState } from 'react'
import { UltraLoader } from './_shared/UltraLoader'
import { api } from '../../lib/api'
import { showToast } from '../../lib/toast'

type Row = {
  id: string; name: string; course: string; progress: number; grade: string; lastActivity: string; status: 'Active'|'Behind'|'Inactive'
}

export default function InstructorStudents() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    // Placeholder: wire to your instructor-students endpoint once ready
    ;(async () => {
      try {
        // demo structure
        setRows([
          { id:'1', name:'Alice Cooper',  course:'React Fundamentals',  progress:85, grade:'A',  lastActivity:'2024-08-10', status:'Active' },
          { id:'2', name:'Bob Wilson',    course:'React Fundamentals',  progress:72, grade:'B+', lastActivity:'2024-08-09', status:'Active' },
          { id:'3', name:'Charlie Brown', course:'Advanced JavaScript', progress:45, grade:'C',  lastActivity:'2024-08-05', status:'Behind' },
          { id:'4', name:'Diana Prince',  course:'React Fundamentals',  progress:90, grade:'A+', lastActivity:'2024-08-11', status:'Active' },
        ])
      } catch (e:any) {
        showToast({ kind:'error', title:'Failed to load', message: e?.response?.data?.message || 'Please try again.' })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <>
      <div>
        <div className="text-[22px] font-semibold text-neutral-900">My Students</div>
        <div className="text-sm text-neutral-500 -mt-0.5">Students enrolled in your courses</div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-separate border-spacing-0 min-w-[980px]">
            <thead>
              <tr className="text-left text-neutral-700">
                <Th>Student</Th><Th>Course</Th><Th>Progress</Th><Th>Grade</Th><Th>Last Activity</Th><Th>Status</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkRows cols={7} rows={4} />
              ) : (
                rows.map(r=>(
                  <tr key={r.id} className="border-b border-neutral-200 last:border-0">
                    <Td className="font-medium text-neutral-900">{r.name}</Td>
                    <Td>{r.course}</Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-40 rounded-full bg-neutral-200 overflow-hidden">
                          <div className="h-2 rounded-full bg-[#0B5CD7]" style={{ width:`${r.progress}%` }} />
                        </div>
                        <span className="text-sm text-neutral-700">{r.progress}%</span>
                      </div>
                    </Td>
                    <Td><Badge label={r.grade} tone="neutral" /></Td>
                    <Td>{r.lastActivity}</Td>
                    <Td>
                      {r.status==='Active' ? <Badge label="Active" tone="primary" /> :
                       r.status==='Behind' ? <Badge label="Behind" tone="warning" /> :
                       <Badge label="Inactive" tone="neutral" />}
                    </Td>
                    <Td className="text-center">
                      <button className="rounded-md p-2 hover:bg-neutral-100" title="View"><span className="inline-block h-1.5 w-1.5 rounded-full bg-neutral-500" /></button>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UltraLoader show={loading} label="Loading students…" />
    </>
  )
}

function Th({ children }: { children: React.ReactNode }) { return <th className="py-3 text-sm font-semibold">{children}</th> }
function Td({ children, className='' }: { children: React.ReactNode; className?: string }) { return <td className={`py-3 text-sm text-neutral-700 ${className}`}>{children}</td> }
function Badge({ label, tone='neutral' }: { label: string; tone?: 'primary'|'neutral'|'warning'|'success' }) {
  const map = {
    primary: 'bg-[#0B5CD7] text-white',
    neutral: 'bg-neutral-100 text-neutral-800',
    warning: 'bg-amber-100 text-amber-800',
    success: 'bg-green-100 text-green-700',
  } as const
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${map[tone]}`}>{label}</span>
}
function SkRows({ cols, rows }: { cols:number; rows:number }) {
  return (
    <>
      {Array.from({length:rows}).map((_, r)=>(
        <tr key={r} className="border-b border-neutral-200 last:border-0">
          {Array.from({length:cols}).map((__, c)=>(
            <td key={c} className="py-3"><div className="h-4 w-[70%] rounded bg-neutral-200 animate-pulse" /></td>
          ))}
        </tr>
      ))}
    </>
  )
}
