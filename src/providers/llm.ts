/**
 * The seam for any language model call.
 *
 * Nothing in this repo calls a model yet. If your design needs one, implement
 * `LlmProvider` for the provider you choose and say why in DESIGN.md. Tests
 * must pass offline, so they should run against `ScriptedLlm` (or your own
 * fake), never against the network.
 *
 * Wrap whatever you use in `MeteredLlm` so a run can report how many calls it
 * made and roughly what they cost.
 */

export interface LlmRequest {
  /** Instructions you wrote. */
  system: string
  /** The content to work on. Treat anything a provider or resident typed as untrusted. */
  input: string
  /** Free-form label for your own accounting, e.g. "offer-structuring". */
  purpose: string
}

export interface LlmResponse {
  text: string
  inputTokens: number
  outputTokens: number
}

export interface LlmProvider {
  complete(req: LlmRequest): Promise<LlmResponse>
}

/** Deterministic fake: answers from a function you supply. */
export class ScriptedLlm implements LlmProvider {
  constructor(private readonly script: (req: LlmRequest) => string) {}

  async complete(req: LlmRequest): Promise<LlmResponse> {
    const text = this.script(req)
    return {
      text,
      inputTokens: Math.ceil((req.system.length + req.input.length) / 4),
      outputTokens: Math.ceil(text.length / 4),
    }
  }
}

export interface LlmUsage {
  calls: number
  inputTokens: number
  outputTokens: number
  byPurpose: Record<string, number>
}

/** Counts calls and tokens, and keeps a copy of every request for inspection. */
export class MeteredLlm implements LlmProvider {
  readonly usage: LlmUsage = { calls: 0, inputTokens: 0, outputTokens: 0, byPurpose: {} }
  readonly requests: LlmRequest[] = []

  constructor(private readonly inner: LlmProvider) {}

  async complete(req: LlmRequest): Promise<LlmResponse> {
    this.requests.push(req)
    const res = await this.inner.complete(req)
    this.usage.calls++
    this.usage.inputTokens += res.inputTokens
    this.usage.outputTokens += res.outputTokens
    this.usage.byPurpose[req.purpose] = (this.usage.byPurpose[req.purpose] ?? 0) + 1
    return res
  }
}
