import { describe, expect, it } from 'vitest'
import { decideStage, type Stage } from '../src/jobs/silent-referral-reminders'
import { daysBetween } from '../src/lib/clock'
import { scoreOfferForNeed } from '../src/services/matching'

const done = (...s: Stage[]) => new Set<Stage>(s)

describe('decideStage', () => {
  it('does nothing before day 5', () => {
    expect(decideStage(4, done())).toBeNull()
  })

  it('sends each reminder once per silent period', () => {
    expect(decideStage(5, done())).toBe('DAY_5')
    expect(decideStage(6, done('DAY_5'))).toBeNull()
    expect(decideStage(10, done('DAY_5'))).toBe('DAY_10')
    expect(decideStage(13, done('DAY_5', 'DAY_10'))).toBeNull()
  })

  it('flags at day 14 instead of emailing again', () => {
    expect(decideStage(13, done('DAY_5', 'DAY_10'))).toBeNull()
    expect(decideStage(14, done('DAY_5', 'DAY_10'))).toBe('FLAG')
    expect(decideStage(30, done('DAY_5', 'DAY_10', 'FLAG'))).toBeNull()
  })
})

describe('daysBetween', () => {
  it('rounds down to whole days', () => {
    const from = new Date('2026-11-02T10:00:00Z')
    expect(daysBetween(from, new Date('2026-11-16T09:00:00Z'))).toBe(13)
    expect(daysBetween(from, new Date('2026-11-16T10:00:00Z'))).toBe(14)
  })
})

describe('scoreOfferForNeed', () => {
  const need = { id: 'n1', category: 'FOOD', residentArea: 'Eastfield' }

  it('ignores offers in another category or another area', () => {
    expect(scoreOfferForNeed({ id: 'o1', categories: 'MOBILITY', area: 'Eastfield' }, need)).toBeNull()
    expect(scoreOfferForNeed({ id: 'o2', categories: 'FOOD', area: 'Quayside' }, need)).toBeNull()
  })

  it('ranks a local offer above an area-wide one', () => {
    const local = scoreOfferForNeed({ id: 'o3', categories: 'FOOD,MONEY_ADVICE', area: 'Eastfield' }, need)
    const wide = scoreOfferForNeed({ id: 'o4', categories: 'FOOD', area: 'ALL' }, need)
    expect(local!.score).toBeGreaterThan(wide!.score)
  })
})
