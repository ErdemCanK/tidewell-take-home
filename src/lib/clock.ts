import 'dotenv/config'

export const DAY_MS = 86_400_000

/** The only place the codebase reads the time. Fixed when TIDEWELL_NOW is set. */
export function now(): Date {
  const fixed = process.env.TIDEWELL_NOW
  return fixed ? new Date(fixed) : new Date()
}

/** Whole days from `from` to `to`, rounded down. */
export function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS)
}
