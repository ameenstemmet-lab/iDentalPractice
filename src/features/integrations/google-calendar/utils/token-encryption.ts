/**
 * AES-256-GCM encryption for OAuth tokens at rest. Defense in depth on top
 * of google_calendar_tokens having no client-facing RLS policy at all —
 * even a leaked service-role key or a future policy mistake shouldn't mean
 * plaintext refresh tokens are readable.
 *
 * The encryption key is passed in, never read from process.env inside
 * this module — callers (services/) load it once from
 * GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY, keeping this file pure and testable.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export function loadEncryptionKey(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, "base64");
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY must be a base64-encoded ${KEY_LENGTH}-byte key, got ${key.length} bytes`
    );
  }
  return key;
}

/** Returns a single base64 string: iv || authTag || ciphertext. */
export function encryptToken(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

/** Throws if the ciphertext was tampered with (GCM auth tag mismatch) or the key is wrong. */
export function decryptToken(encoded: string, key: Buffer): string {
  const raw = Buffer.from(encoded, "base64");
  if (raw.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Encrypted token is malformed or truncated");
  }

  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}
