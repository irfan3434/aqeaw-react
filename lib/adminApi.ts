const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '')

const TOKEN_KEY = 'aqeaw_admin_token'
const USER_KEY = 'aqeaw_admin_user'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token)
}

export function getUser(): AdminUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AdminUser) : null
  } catch {
    return null
  }
}

export function setUser(user: AdminUser) {
  try {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch {
    /* storage unavailable — the token alone is enough to work */
  }
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
}

/**
 * Error carrying the API's status and the extra fields the login endpoints
 * return (`reason`, `attemptsLeft`, `retryAfter`) so callers can show a
 * precise message instead of a generic failure.
 */
export class ApiError extends Error {
  status: number
  reason?: string
  attemptsLeft?: number
  retryAfter?: number

  constructor(
    status: number,
    message: string,
    extra: { reason?: string; attemptsLeft?: number; retryAfter?: number } = {}
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.reason = extra.reason
    this.attemptsLeft = extra.attemptsLeft
    this.retryAfter = extra.retryAfter
  }
}

/**
 * POST helper for the public login endpoints. Deliberately does NOT go through
 * `request()`: a 401 here is an expected answer, not a dead session, so it must
 * not clear the token or bounce the browser back to /admin/login.
 */
async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const d = (data ?? {}) as Record<string, unknown>
    throw new ApiError(res.status, typeof d.error === 'string' ? d.error : res.statusText, {
      reason: typeof d.reason === 'string' ? d.reason : undefined,
      attemptsLeft: typeof d.attemptsLeft === 'number' ? d.attemptsLeft : undefined,
      retryAfter: typeof d.retryAfter === 'number' ? d.retryAfter : undefined,
    })
  }
  return data as T
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (res.status === 401) {
    clearToken()
    if (typeof window !== 'undefined' && !window.location.pathname.endsWith('/admin/login')) {
      window.location.href = '/admin/login'
    }
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${text || res.statusText}`)
  }
  return res.json() as Promise<T>
}

// ---------- Typed API ----------

export interface StatsResponse {
  total: number
  personal: number
  organization: number
  thisWeek: number
}

export interface ApplicationListItem {
  _id: string
  type: 'personal' | 'organization'
  name: string
  email: string
  phone: string
  subtype: string
  affiliation: string
  createdAt: string
}

export interface ListResponse {
  items: ApplicationListItem[]
  counts: { personal: number; organization: number }
}

export interface ListFilters {
  type?: 'all' | 'personal' | 'organization'
  search?: string
  affiliation?: string
  from?: string
  to?: string
  limit?: number
  skip?: number
}

export interface DetailResponse {
  doc: Record<string, unknown>
  type: 'personal' | 'organization'
}

// ---------- Login ----------

export interface AdminUser {
  id: string
  username: string
  name: string
  role: 'admin' | 'judge'
}

/** Signed in — the account has no email, so no code was needed. */
export interface LoginSession {
  ok: true
  token: string
  user: AdminUser
}

/** Password was correct, but a 6-digit code was emailed and must be verified. */
export interface LoginCodeRequired {
  ok: true
  codeRequired: true
  /** Short-lived token tying the code back to this login attempt. */
  challenge: string
  /** Masked address the code was sent to, e.g. "ir****@example.com". */
  email: string
}

export type LoginResponse = LoginSession | LoginCodeRequired

export function isCodeRequired(res: LoginResponse): res is LoginCodeRequired {
  return 'codeRequired' in res && res.codeRequired === true
}

export const adminApi = {
  /**
   * Step 1. Accounts without an email are signed in straight away and the
   * response carries a token; accounts with one get `codeRequired` instead —
   * use `isCodeRequired()` to tell them apart, then call `verifyLoginCode`.
   */
  login: (username: string, password: string) =>
    postJson<LoginResponse>('/admin/login', { username, password }),

  /** Step 2. Exchanges the emailed 6-digit code for a session token. */
  verifyLoginCode: (challenge: string, code: string) =>
    postJson<LoginSession>('/admin/login/verify', { challenge, code }),

  /** Sends a fresh code. The previous one keeps working in case it arrives late. */
  resendLoginCode: (challenge: string) =>
    postJson<{ ok: true }>('/admin/login/resend', { challenge }),

  stats: () => request<StatsResponse>('/admin/stats'),

  list: (filters: ListFilters = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v != null && v !== '') params.set(k, String(v))
    })
    return request<ListResponse>(`/admin/applications?${params.toString()}`)
  },

  detail: (type: 'personal' | 'organization', id: string) =>
    request<DetailResponse>(`/admin/applications/${type}/${id}`),

  /**
   * Download a file from GridFS via the admin API.
   * @param fileId - the GridFS ObjectId string
   * @param originalName - optional filename for the download
   */
  async downloadFile(fileId: string, originalName?: string) {
    const res = await fetch(`${API_BASE}/admin/applications/file/${encodeURIComponent(fileId)}`, {
      headers: { Authorization: `Bearer ${getToken() ?? ''}` },
    })
    if (!res.ok) throw new Error(`Download failed: ${res.status}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = originalName || fileId
    a.click()
    URL.revokeObjectURL(url)
  },

  async downloadExport(filters: { type?: string; from?: string; to?: string } = {}) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    const url = `${API_BASE}/admin/applications/export.xlsx?${params.toString()}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken() ?? ''}` } })
    if (!res.ok) throw new Error(`Export failed: ${res.status}`)
    const blob = await res.blob()
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = `applications-${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(href)
  },
}