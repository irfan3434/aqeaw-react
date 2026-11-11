const CONFIGURED = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '')

/**
 * Backend URL for browser requests.
 * If the configured URL points at localhost but the site was opened from
 * another address (e.g. http://10.0.0.91:3000 on a phone), use that same
 * host so the request reaches this machine instead of the phone itself.
 */
export function apiBase(): string {
  if (typeof window === 'undefined') return CONFIGURED
  try {
    const url = new URL(CONFIGURED)
    const isLocal = (h: string) => h === 'localhost' || h === '127.0.0.1'
    if (isLocal(url.hostname) && !isLocal(window.location.hostname)) {
      url.hostname = window.location.hostname
      return url.toString().replace(/\/$/, '')
    }
  } catch {
    /* fall through */
  }
  return CONFIGURED
}
