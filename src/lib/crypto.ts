import 'dotenv/config'
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto'

function key(): Buffer {
  const hex = process.env.TIDEWELL_ENCRYPTION_KEY
  if (!hex || hex.length !== 64) throw new Error('TIDEWELL_ENCRYPTION_KEY must be 32 bytes of hex')
  return Buffer.from(hex, 'hex')
}

/** Encrypt a value for storage. Output: iv:tag:ciphertext, all hex. */
export function seal(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return [iv.toString('hex'), cipher.getAuthTag().toString('hex'), enc.toString('hex')].join(':')
}

/** Decrypt a stored value. Never log the result. */
export function open(sealed: string): string {
  const [iv, tag, enc] = sealed.split(':')
  if (!iv || !tag || !enc) throw new Error('Malformed sealed value')
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'hex'))
  decipher.setAuthTag(Buffer.from(tag, 'hex'))
  return Buffer.concat([decipher.update(Buffer.from(enc, 'hex')), decipher.final()]).toString('utf8')
}

/** Deterministic hash for looking a person up by email without decrypting. */
export function emailHash(email: string): string {
  const salt = process.env.TIDEWELL_HASH_SALT ?? ''
  return createHmac('sha256', salt).update(email.trim().toLowerCase()).digest('hex')
}
