import 'dotenv/config'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Chat messages do not live in the database. They live in a separate document
 * store; this file is the only way to reach it.
 *
 * Every call pays a network round trip (TIDEWELL_STORE_LATENCY_MS), whether it
 * asks for one thread or a batch. The store counts its calls so a job can
 * report how many it made.
 */

export interface StoredMessage {
  id: string
  threadId: string
  senderId: string
  sentAt: string // ISO 8601
  body: string
}

export const MESSAGE_STORE_PATH = resolve(process.cwd(), 'data/message-store.json')
const MAX_BATCH = 100

export class MessageStore {
  private threads: Record<string, StoredMessage[]>
  private readonly latencyMs: number
  calls = 0

  constructor(opts: { threads?: Record<string, StoredMessage[]>; latencyMs?: number } = {}) {
    this.latencyMs = opts.latencyMs ?? Number(process.env.TIDEWELL_STORE_LATENCY_MS ?? 25)
    if (opts.threads) {
      this.threads = opts.threads
    } else if (existsSync(MESSAGE_STORE_PATH)) {
      this.threads = JSON.parse(readFileSync(MESSAGE_STORE_PATH, 'utf8')).threads
    } else {
      throw new Error('Message store not found. Run `npm run setup` first.')
    }
  }

  private async roundTrip(): Promise<void> {
    this.calls++
    if (this.latencyMs > 0) await new Promise((r) => setTimeout(r, this.latencyMs))
  }

  /** All messages in a thread, oldest first. */
  async listThread(threadId: string): Promise<StoredMessage[]> {
    await this.roundTrip()
    return [...(this.threads[threadId] ?? [])]
  }

  /** The most recent message in a thread, or null if nobody has written. */
  async getLastMessage(threadId: string): Promise<StoredMessage | null> {
    await this.roundTrip()
    const thread = this.threads[threadId] ?? []
    return thread[thread.length - 1] ?? null
  }

  /** The most recent message for up to 100 threads in one round trip. */
  async getLastMessages(threadIds: string[]): Promise<Map<string, StoredMessage | null>> {
    if (threadIds.length > MAX_BATCH) {
      throw new Error(`getLastMessages accepts at most ${MAX_BATCH} threads per call`)
    }
    await this.roundTrip()
    const out = new Map<string, StoredMessage | null>()
    for (const id of threadIds) {
      const thread = this.threads[id] ?? []
      out.set(id, thread[thread.length - 1] ?? null)
    }
    return out
  }
}
