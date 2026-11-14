import 'dotenv/config'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { now } from '../lib/clock'

export interface OutgoingEmail {
  to: string
  subject: string
  text: string
  /** Why this email exists: job name, referral id, stage. No personal data. */
  meta: Record<string, string>
}

export interface EmailProvider {
  send(email: OutgoingEmail): Promise<void>
}

export class RateLimitError extends Error {
  constructor(public readonly limitPerSecond: number) {
    super(`Email provider rate limit exceeded (${limitPerSecond}/s)`)
    this.name = 'RateLimitError'
  }
}

/**
 * Stands in for the real email provider. Nothing is ever sent: each email is
 * written to ./outbox as a JSON file so it can be inspected.
 *
 * Like the real provider, it enforces a rate limit and rejects anything above
 * it. It does not queue or retry on your behalf.
 */
export class OutboxEmailProvider implements EmailProvider {
  private readonly dir = resolve(process.cwd(), 'outbox')
  private readonly maxPerSecond: number
  private recent: number[] = []
  sent = 0

  constructor(opts: { maxPerSecond?: number } = {}) {
    this.maxPerSecond = opts.maxPerSecond ?? Number(process.env.TIDEWELL_EMAIL_MAX_PER_SECOND ?? 5)
    mkdirSync(this.dir, { recursive: true })
  }

  async send(email: OutgoingEmail): Promise<void> {
    const t = Date.now()
    this.recent = this.recent.filter((x) => t - x < 1000)
    if (this.recent.length >= this.maxPerSecond) throw new RateLimitError(this.maxPerSecond)
    this.recent.push(t)

    this.sent++
    const name = `${now().toISOString().replace(/[:.]/g, '-')}-${String(this.sent).padStart(4, '0')}.json`
    writeFileSync(resolve(this.dir, name), JSON.stringify(email, null, 2))
  }
}

/** For tests: keeps emails in memory, no rate limit. */
export class MemoryEmailProvider implements EmailProvider {
  readonly emails: OutgoingEmail[] = []
  async send(email: OutgoingEmail): Promise<void> {
    this.emails.push(email)
  }
}
