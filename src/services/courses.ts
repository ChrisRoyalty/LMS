import { api } from '../lib/api'
import { Course } from '../lib/types'

export type CreateCourseBody = {
  title: string
  description: string
  duration: string
  category: string
}

export type EditCourseBody = Partial<CreateCourseBody>
export type EditCourseResponse = { message: string; course: Course }
export type GetAllCoursesBody = Partial<{
  fullName: string; email: string; roleId: string; courseId: string; batchId: string
}>

export async function getAllCourses(filters?: GetAllCoursesBody) {
  const { data } = await api.post<Course[]>('/api/courses/all-courses', filters ?? {})
  return data
}

export async function createCourse(body: CreateCourseBody) {
  const { data } = await api.post<Course>('/api/courses/create-course', body)
  return data
}

export async function editCourse(id: string, body: EditCourseBody) {
  const { data } = await api.patch<EditCourseResponse>(`/api/courses/edit-course/${id}`, body)
  return data.course
}

export async function deleteCourse(id: string) {
  await api.delete(`/api/courses/delete/${id}`)
}
