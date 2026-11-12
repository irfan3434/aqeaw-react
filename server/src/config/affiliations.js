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

const BY_CODE = new Map(AFFILIATIONS.map((a) => [a.code, a]))

/** Every stored spelling that means this affiliation, legacy ones included. */
const BY_STORED = new Map()
for (const a of AFFILIATIONS) {
  BY_STORED.set(a.code.toLowerCase(), a)
  for (const l of a.legacy) BY_STORED.set(l.toLowerCase(), a)
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
