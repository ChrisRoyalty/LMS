import { useState } from 'react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { SearchInput } from '../../components/ui/SearchInput'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Edit, Trash2, Plus } from 'lucide-react'

type Row = { id: string; name: string; email: string; expertise: string; courses: string[]; joinDate: string; status: 'Active' | 'Inactive' }

export default function Instructors() {
  const [q, setQ] = useState('')
  const rows: Row[] = [
    { id: '1', name: 'John Smith', email: 'john@example.com', expertise: 'Frontend Development', courses: ['React Fundamentals'], joinDate: '2023-09-01', status: 'Active' },
    { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', expertise: 'Backend Development', courses: ['Node.js Backend'], joinDate: '2023-08-15', status: 'Active' },
    { id: '3', name: 'Mike Davis', email: 'mike@example.com', expertise: 'Design', courses: ['UI/UX Design'], joinDate: '2023-10-20', status: 'Active' },
    { id: '4', name: 'Emily Chen', email: 'emily@example.com', expertise: 'Data Science', courses: ['Python Data Science'], joinDate: '2024-01-10', status: 'Active' },
  ]
  const filtered = rows.filter(r => r.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Instructor Management</h1>
        <button className="btn btn-primary inline-flex items-center gap-2"><Plus className="h-4 w-4" /> Add Instructor</button>
      </div>

      <Card>
        <CardHeader>
          <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search instructors..." />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>Instructor</TH>
                <TH>Email</TH>
                <TH>Expertise</TH>
                <TH>Assigned Courses</TH>
                <TH>Join Date</TH>
                <TH>Status</TH>
                <TH>Actions</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map(r => (
                <TR key={r.id}>
                  <TD>{r.name}</TD>
                  <TD className="text-neutral-600">{r.email}</TD>
                  <TD>{r.expertise}</TD>
                  <TD className="space-x-2">
                    {r.courses.map(c => (
                      <Badge key={c} className="border-neutral-300 bg-neutral-50 text-neutral-700">{c}</Badge>
                    ))}
                  </TD>
                  <TD>{r.joinDate}</TD>
                  <TD>
                    <Badge className={r.status === 'Active' ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-neutral-300 text-neutral-700 bg-neutral-50'}>
                      {r.status}
                    </Badge>
                  </TD>
                  <TD className="flex gap-3">
                    <button className="text-neutral-600 hover:text-black" title="Edit"><Edit className="h-4 w-4" /></button>
                    <button className="text-red-600 hover:text-red-700" title="Delete"><Trash2 className="h-4 w-4" /></button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}