/**
 * Judging criteria (weighted points method).
 *
 * The judge only gives each criterion a rating from 1 to 5.
 * The weighted score is calculated automatically:
 *
 *   weighted score = (criterion weight × rating) ÷ 5
 *
 * Weights (`max`) add up to 100, so the total is out of 100.
 * Changing keys later makes old scores for removed keys stop counting.
 */
export const RATING_MIN = 1
export const RATING_MAX = 5

const LIST = [
  {
    key: 'communityImpact',
    max: 30,
    ar: { label: 'الأثر المجتمعي', hint: 'عمق التغيير، عدد المستفيدين، ووضوح النتائج' },
    en: { label: 'Community impact', hint: 'Depth of change, number of beneficiaries, and clarity of results' },
  },
  {
    key: 'exceptionality',
    max: 20,
    ar: { label: 'استثنائية المساهمة', hint: 'تجاوز المألوف أو حدود الدور المعتاد، وحجم الجهد المبذول' },
    en: { label: 'Exceptional contribution', hint: 'Going beyond the usual role, and the effort involved' },
  },
  {
    key: 'innovationExcellence',
    max: 15,
    ar: { label: 'الابتكار والتميّز', hint: 'جدة الفكرة أو تميّز طريقة معالجة الحاجة' },
    en: { label: 'Innovation & distinction', hint: 'Novelty of the idea or a distinctive way of meeting the need' },
  },
  {
    key: 'impactSustainability',
    max: 15,
    ar: { label: 'استدامة الأثر', hint: 'استمرار النفع، وبقاء المعرفة أو القدرة بعد انتهاء العمل' },
    en: { label: 'Lasting impact', hint: 'Benefit continues, and knowledge or capacity remains after the work ends' },
  },
  {
    key: 'evidenceAttribution',
    max: 10,
    ar: { label: 'قوة الأدلة ونسبة الإنجاز', hint: 'موثوقية الشواهد ووضوح إسهام المرشح نفسه' },
    en: { label: 'Evidence & attribution', hint: "Reliable evidence and a clear view of the candidate's own contribution" },
  },
  {
    key: 'integrity',
    max: 10,
    ar: { label: 'القدوة والنزاهة', hint: 'المسؤولية واحترام المستفيدين وحسن السيرة المهنية' },
    en: { label: 'Role model & integrity', hint: 'Responsibility, respect for beneficiaries, and a good professional record' },
  },
]

// `scale` tells the pages the rating range (1–5).
export const CRITERIA = LIST.map((c) => ({ ...c, scale: RATING_MAX }))

export const MAX_TOTAL = CRITERIA.reduce((sum, c) => sum + c.max, 0)

/** Weighted points for one criterion: (weight × rating) ÷ 5 */
export function weightedScore(criterion, rating) {
  return Math.round(((criterion.max * rating) / RATING_MAX) * 100) / 100
}

/** Final weighted score out of 100 from a { key: rating } object. */
export function weightedTotal(ratings) {
  const sum = CRITERIA.reduce((s, c) => s + weightedScore(c, Number(ratings[c.key]) || 0), 0)
  return Math.round(sum * 100) / 100
}
