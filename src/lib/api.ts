// src/lib/api.ts
import axios from 'axios'

/** Prefer HTTPS by default; env can override */
const RAW_BASE: string =
  ((import.meta as any).env?.VITE_API_BASE_URL as string) ||
  'https://lms.bookbank.com.ng'

function ensureAbsolute(u: string) {
  try {
    return new URL(u).toString()
  } catch {
    return `https://${u.replace(/^https?:\/\//, '')}`
  }
}
let BASE = ensureAbsolute(RAW_BASE)

export const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
})

/** Token helpers */
export function setAuthToken(token?: string | null) {
  if (token) {
    localStorage.setItem('token', token)
    ;(api.defaults.headers.common as any).Authorization = `Bearer ${token}`
  } else {
    localStorage.removeItem('token')
    delete (api.defaults.headers.common as any).Authorization
  }
}

/** Bootstrap token/header on first import (handles page refresh) */
try {
  const t = localStorage.getItem('token')
  if (t) (api.defaults.headers.common as any).Authorization = `Bearer ${t}`
} catch { /* ignore */ }

/** Always attach token from storage (belt & suspenders) */
api.interceptors.request.use((config) => {
  const t = localStorage.getItem('token')
  if (t) {
    config.headers = config.headers ?? {}
    ;(config.headers as any).Authorization = `Bearer ${t}`
  }
  return config
})

/**
 * Network resilience:
 * - If a request to http://… fails with a network error and the host isn’t localhost,
 *   retry once over https://…
 */
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const cfg: any = err?.config
    const noResponse = !err?.response
    if (
      noResponse &&
      cfg &&
      !cfg.__retriedHttps &&
      typeof api.defaults.baseURL === 'string'
    ) {
      try {
        const url = new URL(api.defaults.baseURL!)
        const isHttp = url.protocol === 'http:'
        const isLocal = /^(localhost|127\.0\.0\.1)/i.test(url.hostname)
        if (isHttp && !isLocal) {
          const httpsBase = `https://${url.host}`
          api.defaults.baseURL = httpsBase
          cfg.baseURL = httpsBase
          cfg.__retriedHttps = true
          return api.request(cfg)
        }
      } catch {
        /* fall through */
      }
    }
    return Promise.reject(err)
  }
)
