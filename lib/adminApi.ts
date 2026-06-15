const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '')

const TOKEN_KEY = 'aqeaw_admin_token'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY)
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

export const adminApi = {
  async login(password: string): Promise<{ token: string }> {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(res.status === 401 ? 'Invalid password' : `Login failed: ${text}`)
    }
    return res.json()
  },

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