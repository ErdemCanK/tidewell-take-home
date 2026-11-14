import { db } from '../lib/db'
import { open } from '../lib/crypto'
import { caseloadFor } from '../services/access'
import { scoreOfferForNeed, type MatchScore } from '../services/matching'

/**
 * What a coordinator sees when they open Tidewell: their own caseload and the
 * published offers that suit each resident's open needs.
 *
 *   npm run coordinator -- coord_northbank
 *
 * The coordinator is the person asking, and they only ever see their own
 * caseload. This prints names because it stands in for that coordinator's
 * screen; it is not a log.
 */
async function main() {
  const coordinatorId = process.argv[2]
  if (!coordinatorId) {
    console.error('Usage: npm run coordinator -- <coordinatorId>')
    process.exitCode = 1
    return
  }

  const residents = await caseloadFor(coordinatorId)
  const offers = await db.offer.findMany({ where: { status: 'PUBLISHED' }, include: { provider: true } })

  for (const resident of residents) {
    const needs = await db.need.findMany({ where: { residentId: resident.id, status: 'OPEN' } })
    const suggestions: (MatchScore & { title: string; provider: string })[] = []
    for (const need of needs) {
      for (const offer of offers) {
        const score = scoreOfferForNeed(offer, { id: need.id, category: need.category, residentArea: resident.area })
        if (score) suggestions.push({ ...score, title: offer.title, provider: offer.provider.name })
      }
    }
    suggestions.sort((a, b) => b.score - a.score)

    console.log(`\n${open(resident.nameEncrypted)} (${resident.id}, ${resident.area})`)
    console.log(`  open needs: ${needs.map((n) => n.category).join(', ') || 'none'}`)
    for (const s of suggestions.slice(0, 3)) {
      console.log(`  ${s.score}  ${s.title} — ${s.provider}  [${s.reasons.join(', ')}]`)
    }
  }
}

main()
  .catch((err) => {
    console.error(`${err.name}: ${err.message}`)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
