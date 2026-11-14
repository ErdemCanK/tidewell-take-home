import { db } from '../lib/db'
import { now, daysBetween } from '../lib/clock'
import { open } from '../lib/crypto'
import type { EmailProvider } from '../providers/email'
import type { MessageStore } from '../providers/message-store'

/**
 * Silent referral reminders. Runs once a day.
 *
 * The rule, as the operations team asked for it:
 *   "After 5 days with no message, remind the people who have not replied.
 *    Again after 10. At 14 days, stop emailing and flag it for the admin team."
 *
 * Silence is counted from the last message in the thread, or from the day the
 * referral was opened if nobody has written yet.
 */

export const DAY_5 = 5
export const DAY_10 = 10
export const FLAG_AT = 14

export type Stage = 'DAY_5' | 'DAY_10' | 'FLAG'

/** Which step is due, given how long the thread has been silent and what was already done. */
export function decideStage(silentDays: number, done: ReadonlySet<Stage>): Stage | null {
  if (silentDays >= FLAG_AT) return done.has('FLAG') ? null : 'FLAG'
  if (silentDays >= DAY_10) return done.has('DAY_10') ? null : 'DAY_10'
  if (silentDays >= DAY_5) return done.has('DAY_5') ? null : 'DAY_5'
  return null
}

export interface ReminderRunResult {
  referralsChecked: number
  remindersSent: number
  flagsRaised: number
  skippedNoEmail: number
}

export async function runSilentReferralReminders(deps: {
  email: EmailProvider
  messages: MessageStore
}): Promise<ReminderRunResult> {
  const result: ReminderRunResult = { referralsChecked: 0, remindersSent: 0, flagsRaised: 0, skippedNoEmail: 0 }
  const today = now()

  const referrals = await db.referral.findMany({
    where: { status: 'OPEN' },
    include: { participants: { include: { person: true } }, provider: true },
  })

  for (const referral of referrals) {
    result.referralsChecked++

    const last = await deps.messages.getLastMessage(referral.threadId)
    const silenceStartedAt = last ? new Date(last.sentAt) : referral.openedAt
    const silentDays = daysBetween(silenceStartedAt, today)

    const [logs, flag] = await Promise.all([
      db.reminderLog.findMany({ where: { referralId: referral.id, silenceStartedAt }, select: { stage: true } }),
      db.adminFlag.findUnique({ where: { referralId_silenceStartedAt: { referralId: referral.id, silenceStartedAt } } }),
    ])
    const done = new Set<Stage>(logs.map((l) => l.stage as Stage))
    if (flag) done.add('FLAG')

    const stage = decideStage(silentDays, done)
    if (!stage) continue

    if (stage === 'FLAG') {
      await db.adminFlag.create({
        data: { referralId: referral.id, reason: `No message for ${FLAG_AT} days`, silenceStartedAt, createdAt: today },
      })
      result.flagsRaised++
      continue
    }

    // Remind everyone in the thread except whoever wrote last.
    const recipients = referral.participants
      .map((p) => p.person)
      .filter((p) => p.id !== last?.senderId && p.isActive && p.emailNotificationsEnabled)

    for (const person of recipients) {
      if (!person.emailEncrypted) {
        result.skippedNoEmail++
        continue
      }
      await deps.email.send({
        to: open(person.emailEncrypted),
        subject: 'A conversation on Tidewell is waiting for a reply',
        text:
          `Hello,\n\nThe conversation with ${referral.provider.name} has had no new message for ${silentDays} days.\n` +
          `Open Tidewell to reply: https://tidewell.example/referrals/${referral.id}\n`,
        meta: { job: 'silent-referral-reminders', referralId: referral.id, stage },
      })
      await db.reminderLog.create({
        data: { referralId: referral.id, personId: person.id, stage, silenceStartedAt, sentAt: today },
      })
      result.remindersSent++
    }
  }

  return result
}
