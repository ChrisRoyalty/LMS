// src/lib/users.ts
import { api } from './api'

// 🔧 If your server uses different paths or methods, change these two lines.
const UPDATE_USER_ENDPOINT = (id: string) => `/api/user/update/${id}`     // e.g., PATCH /api/user/update/:id
const DELETE_USER_ENDPOINT = (id: string) => `/api/user/delete/${id}`     // e.g., DELETE /api/user/delete/:id`

export type UpdateUserBody = Partial<{
  fullName: string
  email: string
  courseId: string
  batchId: string
  roleId: string
  status: string
}>

export async function updateUser(id: string, body: UpdateUserBody) {
  // Most backends prefer PATCH; switch to PUT if needed.
  return api.patch(UPDATE_USER_ENDPOINT(id), body)
}

export async function deleteUser(id: string) {
  return api.delete(DELETE_USER_ENDPOINT(id))
}
