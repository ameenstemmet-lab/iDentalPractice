import "server-only";
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/**
 * The AI assistant is optional infra, not a hard dependency of the app —
 * this throws a friendly error instead of crashing at import time when
 * ANTHROPIC_API_KEY isn't set, so the rest of the dashboard keeps working.
 */
export function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("The AI assistant isn't configured yet — set ANTHROPIC_API_KEY to enable it.");
  }
  if (!client) client = new Anthropic({ apiKey });
  return client;
}
