import { db } from '../lib/db'
import { now } from '../lib/clock'
import { OutboxEmailProvider } from '../providers/email'
import { MessageStore } from '../providers/message-store'
import { runSilentReferralReminders } from '../jobs/silent-referral-reminders'

/**
 * Entry point for scheduled jobs. In production each of these is called by the
 * scheduler; here you run them by hand:
 *
 *   npm run job:reminders
 */
async function main() {
  const job = process.argv[2]

  if (job === 'reminders') {
    const email = new OutboxEmailProvider()
    const messages = new MessageStore()
    const started = Date.now()
    const result = await runSilentReferralReminders({ email, messages })
    console.log(
      JSON.stringify(
        { job, clock: now().toISOString(), ...result, messageStoreCalls: messages.calls, wallClockMs: Date.now() - started },
        null,
        2,
      ),
    )
    return
  }

  console.error('Usage: tsx src/controllers/jobs.ts <reminders>')
  process.exitCode = 1
}

main()
  .catch((err) => {
    console.error(`${err.name}: ${err.message}`)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
