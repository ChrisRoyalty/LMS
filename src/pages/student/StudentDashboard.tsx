import { Card, CardContent, CardHeader } from '../../components/ui/Card'

export function StudentDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Student Dashboard</h1>
      <Card>
        <CardHeader><h2 className="font-medium">My Enrollments</h2></CardHeader>
        <CardContent>
          <p className="muted">Hook this up to /student/enrollments.</p>
        </CardContent>
      </Card>
    </div>
  )
}