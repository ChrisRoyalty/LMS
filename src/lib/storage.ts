const TOKEN_KEY = 'lms_token'
const USER_KEY  = 'lms_user'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getUser(): any | null {
  const raw = localStorage.getItem(USER_KEY)
  try { return raw ? JSON.parse(raw) : null } catch { return null }
}
export function setUser(user: any) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}
export function clearUser() {
  localStorage.removeItem(USER_KEY)
}
