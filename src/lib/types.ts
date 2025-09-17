export type Role = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'

/** Server response shapes (from your Postman sample) */
export type ServerRoleName = 'admin' | 'instructor' | 'student'
export type ServerRole = { id: string; name: ServerRoleName }

export type ServerUser = {
  id: string
  fullName: string
  email: string
  roleId: string
  expertise: string | null
  status: string
  joinedAt: string
  createdAt: string
  updatedAt: string
  role: ServerRole
}

export type LoginResponse = {
  token: string
  user: ServerUser
}

/** Frontend-friendly user we use across the app */
export type User = {
  id: string
  name: string
  email: string
  role: Role
}

// --- Admin dashboard payload from /api/dashboard/admin-dashboard ---
export type AdminDashboardStudent = {
  id: string
  fullName: string
  email: string
  roleId: string
  role?: { name?: string } | null
  UserCourse?: { role?: string | null; createdAt?: string | null } | null
}



export type AdminDashboardCourse = {
  id: string
  title: string
  studentCount: number
  students: AdminDashboardStudent[]
  instructors: any[]
}



export type AdminDashboardPayload = {
  totalCourses: number
  totalStudents: number
  totalInstructors: number
  topCourses: AdminDashboardCourse[]
  activeBatches: number
  // Optional (not in sample, but supported if backend adds it):
  totalInterns?: number
}

// --- Courses ---
export type Course = {
  id: string
  title: string
  description: string
  category: string
  duration: string
  createdAt: string
  updatedAt: string
  // present when listing:
  students?: Array<{
    id: string
    fullName: string
    email: string
    roleId: string
    role?: { name?: string }
    batches?: Array<{ id: string; name: string }>
    UserCourse?: { role?: string; progress?: number; completionStatus?: string; grade?: string | null }
  }>
  instructors?: Array<{
    id: string
    fullName: string
    email: string
    roleId: string
    role?: { name?: string }
    UserCourse?: { role?: string }
  }>
  noOfStudents?: number
}

export type CreateCourseBody = {
  title: string
  description: string
  duration: string
  category: string
}

export type EditCourseBody = Partial<CreateCourseBody>

export type EditCourseResponse = {
  message: string
  course: Course
}

// Body allowed by /api/courses/all-courses (backend accepts filters)
export type GetAllCoursesBody = Partial<{
  fullName: string
  email: string
  roleId: string
  courseId: string
  batchId: string
}>



