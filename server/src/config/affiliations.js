/**
 * The affiliations an individual applicant can choose.
 *
 * Until now the form posted whichever label the applicant happened to be
 * reading, so the same affiliation was stored as "Al-Saraa" for an English
 * visitor and "محافظة بلقرن والسراة" for an Arabic one. Counting, filtering and
 * the Excel export all treated those as two different affiliations.
 *
 * The form now posts `code` instead. Everything that reads the value goes
 * through the helpers below, which understand both the codes and every label
 * that was stored before the change — so existing applications keep working
 * and no migration is required. `legacy` is that list of historical spellings;
 * nothing new is ever written in those forms.
 *
 * The frontend mirrors this in lib/affiliations.ts (it cannot import from
 * server/, which deploys separately). Keep the codes identical in both.
 */
export const AFFILIATIONS = [
  {
    code: 'alsaraa',
    ar: 'السرة',
    en: 'Al-Saraa',
    legacy: ['Al-Saraa', 'السرة', 'السراة', 'محافظة بلقرن والسراة'],
  },
  {
    code: 'tahamah',
    ar: 'تهامة',
    en: 'Tahamah',
    legacy: ['Tahamah', 'تهامة'],
  },
]

/** Every stored spelling that means this affiliation, legacy ones included. */
const BY_STORED = new Map()
for (const a of AFFILIATIONS) {
  BY_STORED.set(a.code.toLowerCase(), a)
  for (const l of a.legacy) BY_STORED.set(l.toLowerCase(), a)
}

/**
 * Whether an incoming value names one of the two affiliations.
 *
 * Deliberately more lenient than isValidAffiliation() in lib/affiliations.ts,
 * which accepts the codes alone. The form only ever posts codes, so strictness
 * here would cost nothing in the normal case — but a tab left open from before
 * the codes existed still posts a label, and rejecting that would throw away a
 * real application over a cached page. Every legacy spelling is accepted and
 * normalizeAffiliation() stores it as the canonical code either way, so a
 * lenient check cannot let a wrong value through to the database.
 */
export function isValidAffiliation(value) {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return BY_STORED.has(raw)
}

/**
 * Turn whatever arrived — a code, or any label an older form posted — into the
 * canonical code. Anything unrecognised is returned trimmed and unchanged, so
 * a value we have never seen is preserved rather than silently dropped.
 */
export function normalizeAffiliation(value) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return ''
  return BY_STORED.get(raw.toLowerCase())?.code ?? raw
}

/**
 * A human-readable label for display (admin pages, email, Excel).
 * Unknown values — including rows written before the codes existed — are shown
 * as they are stored, which is still the correct Arabic or English label.
 */
export function affiliationLabel(value, lang = 'en') {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return ''
  const found = BY_STORED.get(raw.toLowerCase())
  if (!found) return raw
  return lang === 'ar' ? found.ar : found.en
}

/**
 * Every value to match when filtering by one affiliation, so a filter set to
 * "alsaraa" still finds the applications stored under the old labels.
 */
export function affiliationQueryValues(value) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return []
  const found = BY_STORED.get(raw.toLowerCase())
  if (!found) return [raw]
  return [found.code, ...found.legacy]
}
