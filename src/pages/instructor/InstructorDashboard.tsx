import { Card, CardContent, CardHeader } from '../../components/ui/Card'

export function InstructorDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Instructor Dashboard</h1>
      <Card>
        <CardHeader><h2 className="font-medium">Your Courses</h2></CardHeader>
        <CardContent>
          <p className="muted">Hook this up to /instructor/courses.</p>
        </CardContent>
      </Card>
    </div>
  )
}