/**
 * The affiliations an individual applicant can choose.
 *
 * `code` is what the form posts and what the database stores. Before this
 * existed the form posted whichever label the applicant was reading, so the
 * same affiliation was saved as 'Al-Saraa' in English and 'محافظة بلقرن والسراة'
 * in Arabic — two values for one thing, which broke filtering and counting.
 *
 * `legacy` lists those older spellings so applications submitted before the
 * change still display and filter correctly. Nothing new is written that way.
 *
 * This mirrors server/src/config/affiliations.js. The two deploy separately
 * (Vercel and Heroku), so the frontend cannot import the server's copy — keep
 * the codes identical in both files.
 */
export type AffiliationCode = 'alsaraa' | 'tahamah'

export interface Affiliation {
  code: AffiliationCode
  ar: string
  en: string
  legacy: string[]
}

export const AFFILIATIONS: Affiliation[] = [
  {
    code: 'alsaraa',
    ar: 'محافظة بلقرن والسراة',
    en: 'Al-Saraa',
    legacy: ['Al-Saraa', 'محافظة بلقرن والسراة', 'السراة'],
  },
  {
    code: 'tahamah',
    ar: 'تهامة',
    en: 'Tahamah',
    legacy: ['Tahamah', 'تهامة'],
  },
]

const BY_STORED = new Map<string, Affiliation>()
for (const a of AFFILIATIONS) {
  BY_STORED.set(a.code.toLowerCase(), a)
  for (const l of a.legacy) BY_STORED.set(l.toLowerCase(), a)
}

/**
 * A readable label for a stored value, in the language being displayed.
 * Values written before the codes existed are already readable labels, so an
 * unrecognised value is returned unchanged rather than hidden.
 */
export function affiliationLabel(value: string | undefined, lang: 'en' | 'ar'): string {
  const raw = (value ?? '').trim()
  if (!raw) return ''
  const found = BY_STORED.get(raw.toLowerCase())
  if (!found) return raw
  return lang === 'ar' ? found.ar : found.en
}
