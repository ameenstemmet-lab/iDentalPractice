/**
 * Stateless, signed OAuth `state` parameter — CSRF protection without a
 * database round trip. Encodes which practice (and optionally which
 * practitioner) initiated the connect flow, so the callback route knows where
 * to attach the resulting connection, and rejects anything it didn't
 * itself issue or that's expired.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { OAuthStatePayload } from "../types";

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function createOAuthState(
  params: { practiceId: string; practitionerId: string | null },
  secret: string
): string {
  const payload: OAuthStatePayload = {
    practiceId: params.practiceId,
    practitionerId: params.practitionerId,
    nonce: randomBytes(16).toString("hex"),
    issuedAt: Date.now(),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

export interface VerifyStateResult {
  valid: boolean;
  payload?: OAuthStatePayload;
  error?: string;
}

export function verifyOAuthState(state: string, secret: string, now: Date = new Date()): VerifyStateResult {
  const parts = state.split(".");
  if (parts.length !== 2) {
    return { valid: false, error: "Malformed state parameter" };
  }
  const [encodedPayload, signature] = parts;

  const expected = sign(encodedPayload, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return { valid: false, error: "Invalid state signature" };
  }

  let payload: OAuthStatePayload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return { valid: false, error: "Malformed state payload" };
  }

  if (now.getTime() - payload.issuedAt > STATE_TTL_MS) {
    return { valid: false, error: "State parameter has expired" };
  }

  return { valid: true, payload };
}
