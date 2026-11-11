import { apiBase } from './apiBase'

const TOKEN_KEY = 'aqeaw_admin_token'
const USER_KEY = 'aqeaw_admin_user'

export type Role = 'superadmin' | 'admin' | 'judge'

export interface SessionUser {
  id: string
  username: string
  name: string
  role: Role
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function getSessionUser(): SessionUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as SessionUser) : null
  } catch {
    return null
  }
}

export function setSession(token: string, user: SessionUser) {
  window.localStorage.setItem(TOKEN_KEY, token)
  window.localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
}

/** Where each role lands after login. */
export function homeFor(role: Role | undefined) {
  return role === 'judge' ? '/judge' : '/admin'
}

/**
 * Page guard: returns true if the current session has the role.
 * Otherwise redirects (to login, or to the other role's home) and returns false.
 */
export function guardRole(role: Role, replace: (href: string) => void): boolean {
  const user = getSessionUser()
  if (!getToken() || !user) {
    replace('/admin/login')
    return false
  }
  // A superadmin can do everything an admin can, so it satisfies 'admin' too.
  const satisfied = user.role === role || (role === 'admin' && user.role === 'superadmin')
  if (!satisfied) {
    replace(homeFor(user.role))
    return false
  }
  return true
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${apiBase()}${path}`, { ...init, headers })
  if (res.status === 401) {
    clearToken()
    if (typeof window !== 'undefined' && !window.location.pathname.endsWith('/admin/login')) {
      window.location.href = '/admin/login'
    }
    throw new Error('Unauthorized')
  }
  if (res.status === 403) {
    // Logged in, but with the other role — send them to their own page.
    if (typeof window !== 'undefined') window.location.href = homeFor(getSessionUser()?.role)
    throw new Error('Forbidden')
  }
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message = body?.error || message
    } catch {
      /* not JSON */
    }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

async function downloadBlob(path: string, fallbackName: string) {
  const res = await fetch(`${apiBase()}${path}`, {
    headers: { Authorization: `Bearer ${getToken() ?? ''}` },
  })
  if (!res.ok) throw new Error(`Download failed: ${res.status}`)
  const disposition = res.headers.get('Content-Disposition') || ''
  const match = /filename="([^"]+)"/.exec(disposition)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = match ? decodeURIComponent(match[1]) : fallbackName
  a.click()
  URL.revokeObjectURL(url)
}

export type LoginResult =
  | { token: string; user: SessionUser; codeRequired?: false }
  | { codeRequired: true; challenge: string; email: string }

/** Error from the login endpoints, with the server's details attached. */
export class AuthError extends Error {
  status: number
  data: { reason?: string; attemptsLeft?: number; retryAfter?: number }
  constructor(status: number, message: string, data: AuthError['data']) {
    super(message)
    this.status = status
    this.data = data
  }
}

async function authPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new AuthError(res.status, data?.error || res.statusText, data || {})
  return data as T
}

// ---------- Shared types ----------

export interface Criterion {
  key: string
  /** Weight: the most points this criterion can add to the total */
  max: number
  /** Judges rate 1..scale (5) */
  scale: number
  ar: { label: string; hint: string }
  en: { label: string; hint: string }
}

export interface EvaluationSummary {
  avg: number
  count: number
  maxTotal: number
  judges: { name: string; total: number }[]
}

/** Weighted points for one criterion: (weight × rating) ÷ scale */
export function weightedScore(c: Criterion, rating: number) {
  return Math.round(((c.max * rating) / (c.scale || 5)) * 100) / 100
}

// ---------- Admin types ----------

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
  code: string
  evaluation: EvaluationSummary | null
  result: Result
}

export type Result = 'winner' | 'notWinner' | 'pending'

export interface JudgingSettings {
  passScore: number
  minJudges: number
  maxTotal: number
}

export interface ListResponse {
  items: ApplicationListItem[]
  counts: { personal: number; organization: number }
  resultCounts: Record<Result, number>
  settings: JudgingSettings
}

export interface ListFilters {
  type?: 'all' | 'personal' | 'organization'
  search?: string
  affiliation?: string
  from?: string
  to?: string
  result?: '' | Result
  sort?: 'date' | 'score'
  limit?: number
  skip?: number
}

export interface AdminEvaluation {
  _id: string
  judgeName: string
  scores: Record<string, number>
  total: number
  maxTotal: number
  comment: string
  updatedAt: string
}

export interface DetailResponse {
  doc: Record<string, unknown>
  type: 'personal' | 'organization'
  code: string
  criteria: Criterion[]
  maxTotal: number
  evaluations: AdminEvaluation[]
  result: Result
  settings: { passScore: number; minJudges: number }
}

/** Alias kept for the accounts page, which calls it ManagedUser. */
export type ManagedUser = DashboardUser

export interface DashboardUser {
  _id: string
  username: string
  name: string
  role: Role
  email: string
  active: boolean
  lastLoginAt: string | null
  createdAt: string
  evaluations: number
}

// ---------- Profile cards ----------

export interface ProfileCardFields {
  tag: string
  rank: string
  rname: string
  h1: string
  h2: string
  p1: string
  p2: string
  foot: string
  mode: 'cutout' | 'circle'
  variant: '1' | '2' | '3'
  navy: string
  gold: string
  footc: string
  published: boolean
  order: number
}

export interface ProfileCardItem extends ProfileCardFields {
  _id: string
  /** Path on the API server, e.g. /profile-cards/photo/<id>; '' when there is no photo */
  photoUrl: string
  createdAt: string
  updatedAt: string
}

/** photo: a data URL to replace it, '' to remove it, leave out to keep it */
export type ProfileCardBody = Partial<ProfileCardFields> & { photo?: string }

/** Full URL for a card photo path returned by the API. */
export function profileCardPhotoSrc(photoUrl: string) {
  return photoUrl ? `${apiBase()}${photoUrl}` : ''
}

/** Published cards for the homepage (no login needed). */
export async function fetchPublishedProfileCards(): Promise<ProfileCardItem[]> {
  const res = await fetch(`${apiBase()}/profile-cards`)
  if (!res.ok) throw new Error(`Failed to load cards: ${res.status}`)
  const data = (await res.json()) as { cards: ProfileCardItem[] }
  return data.cards
}

// ---------- Judge types ----------

export interface JudgeListItem {
  ref: string
  code: string
  /** Position in the full list, stable across filters. */
  seq: number
  achievementsCount: number
  /** Submission date as YYYY-MM-DD. Date only — never a time. */
  submittedOn: string | null
  myEvaluation: { done: true } | null
}

export interface JudgeListResponse {
  items: JudgeListItem[]
  progress: { evaluated: number; total: number }
}

/** What a judge sees of a criterion: no weight. */
export type JudgeCriterion = Omit<Criterion, 'max'>

export interface MyEvaluation {
  scores: Record<string, number>
  comment: string
  updatedAt: string
}

export interface JudgeDetailResponse {
  ref: string
  code: string
  nominationReason: string
  achievements: {
    index: number
    title: string
    description: string
    file: { available: boolean; ext?: string; size?: number | null } | null
  }[]
  criteria: JudgeCriterion[]
  myEvaluation: MyEvaluation | null
}

// ---------- API ----------

export const adminApi = {
  /** Step 1: password. Returns a session, or a challenge if an email code is needed. */
  login: (username: string, password: string) =>
    authPost<LoginResult>('/admin/login', { username, password }),

  /** Step 2: the 6-digit code from the email. */
  verifyCode: (challenge: string, code: string) =>
    authPost<{ token: string; user: SessionUser }>('/admin/login/verify', { challenge, code }),

  resendCode: (challenge: string) => authPost<{ ok: true }>('/admin/login/resend', { challenge }),

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

  /** Download a file from GridFS via the admin API. */
  downloadFile: (fileId: string, originalName?: string) =>
    downloadBlob(`/admin/applications/file/${encodeURIComponent(fileId)}`, originalName || fileId),

  async downloadExport(filters: { type?: string; from?: string; to?: string } = {}) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    await downloadBlob(
      `/admin/applications/export.xlsx?${params.toString()}`,
      `applications-${new Date().toISOString().slice(0, 10)}.xlsx`
    )
  },

  // Delete evaluations (the judge can then score again)
  deleteEvaluation: (id: string) => request<{ ok: true }>(`/admin/evaluations/${id}`, { method: 'DELETE' }),
  deleteAllEvaluations: (type: 'personal' | 'organization', id: string) =>
    request<{ ok: true; deleted: number }>(`/admin/applications/${type}/${id}/evaluations`, { method: 'DELETE' }),

  // Winning rules
  saveSettings: (body: { passScore: number; minJudges: number }) =>
    request<{ settings: JudgingSettings }>('/admin/settings', { method: 'PUT', body: JSON.stringify(body) }),

  // Accounts
  /** Who am I, according to the server. Any signed-in account may call it. */
  me: () => request<{ user: DashboardUser }>('/admin/me'),

  users: () => request<{ users: DashboardUser[] }>('/admin/users'),
  createUser: (body: { username: string; name: string; role: Role; password: string; email?: string }) =>
    request<{ user: DashboardUser }>('/admin/users', { method: 'POST', body: JSON.stringify(body) }),
  updateUser: (id: string, body: Partial<{ name: string; role: Role; password: string; active: boolean; email: string }>) =>
    request<{ user: DashboardUser }>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteUser: (id: string) => request<{ ok: true }>(`/admin/users/${id}`, { method: 'DELETE' }),

  // Profile cards (homepage)
  profileCards: () => request<{ cards: ProfileCardItem[] }>('/admin/profile-cards'),
  createProfileCard: (body: ProfileCardBody) =>
    request<{ card: ProfileCardItem }>('/admin/profile-cards', { method: 'POST', body: JSON.stringify(body) }),
  updateProfileCard: (id: string, body: ProfileCardBody) =>
    request<{ card: ProfileCardItem }>(`/admin/profile-cards/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteProfileCard: (id: string) => request<{ ok: true }>(`/admin/profile-cards/${id}`, { method: 'DELETE' }),
}

export const judgeApi = {
  list: () => request<JudgeListResponse>('/judge/applications'),
  detail: (ref: string) => request<JudgeDetailResponse>(`/judge/applications/${encodeURIComponent(ref)}`),
  submit: (ref: string, body: { scores: Record<string, number>; comment: string }) =>
    request<{ ok: true; evaluation: MyEvaluation }>(`/judge/applications/${encodeURIComponent(ref)}/evaluation`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  downloadFile: (ref: string, index: number) =>
    downloadBlob(`/judge/applications/${encodeURIComponent(ref)}/file/${index}`, `achievement-${index + 1}`),
}
