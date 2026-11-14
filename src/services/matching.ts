/**
 * How Tidewell decides which published offers suit an open need. Used today by
 * the coordinator's "suggestions" view (src/controllers/coordinator.ts).
 *
 * Deliberately simple and explainable: no model, no free text.
 */

export interface OfferForMatching {
  id: string
  categories: string // comma-separated
  area: string
}

export interface NeedForMatching {
  id: string
  category: string
  residentArea: string
}

export interface MatchScore {
  offerId: string
  needId: string
  score: number // 0..100
  reasons: string[]
}

export function offerCategories(offer: { categories: string }): string[] {
  return offer.categories.split(',').map((c) => c.trim()).filter(Boolean)
}

/** Returns null when the offer is not relevant to the need at all. */
export function scoreOfferForNeed(offer: OfferForMatching, need: NeedForMatching): MatchScore | null {
  if (!offerCategories(offer).includes(need.category)) return null

  const reasons = [`category:${need.category}`]
  let score = 70
  if (offer.area === 'ALL') {
    score += 15
    reasons.push('area:all')
  } else if (offer.area === need.residentArea) {
    score += 30
    reasons.push(`area:${offer.area}`)
  } else {
    return null
  }
  return { offerId: offer.id, needId: need.id, score, reasons }
}
