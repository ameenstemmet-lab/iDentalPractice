import { describe, expect, it } from "vitest";
import { createOAuthState, verifyOAuthState } from "./oauth-state";

const SECRET = "test-state-secret";

describe("createOAuthState / verifyOAuthState", () => {
  it("round-trips a valid state and recovers the payload", () => {
    const state = createOAuthState({ practiceId: "practice-1", practitionerId: "practitioner-1" }, SECRET);
    const result = verifyOAuthState(state, SECRET);
    expect(result.valid).toBe(true);
    expect(result.payload).toMatchObject({ practiceId: "practice-1", practitionerId: "practitioner-1" });
  });

  it("supports a null practitionerId (practice-wide connection)", () => {
    const state = createOAuthState({ practiceId: "practice-1", practitionerId: null }, SECRET);
    const result = verifyOAuthState(state, SECRET);
    expect(result.payload?.practitionerId).toBeNull();
  });

  it("rejects a state signed with a different secret", () => {
    const state = createOAuthState({ practiceId: "practice-1", practitionerId: null }, SECRET);
    const result = verifyOAuthState(state, "wrong-secret");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/signature/i);
  });

  it("rejects a tampered payload even reusing the original signature", () => {
    const state = createOAuthState({ practiceId: "practice-1", practitionerId: null }, SECRET);
    const [, signature] = state.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({ practiceId: "someone-elses-practice", practitionerId: null, nonce: "x", issuedAt: Date.now() }),
      "utf8"
    ).toString("base64url");
    const result = verifyOAuthState(`${tamperedPayload}.${signature}`, SECRET);
    expect(result.valid).toBe(false);
  });

  it("rejects a malformed state", () => {
    expect(verifyOAuthState("not-a-valid-state", SECRET).valid).toBe(false);
    expect(verifyOAuthState("", SECRET).valid).toBe(false);
  });

  it("rejects an expired state", () => {
    const state = createOAuthState({ practiceId: "practice-1", practitionerId: null }, SECRET);
    const elevenMinutesLater = new Date(Date.now() + 11 * 60 * 1000);
    const result = verifyOAuthState(state, SECRET, elevenMinutesLater);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/expired/i);
  });

  it("accepts a state right up to the expiry boundary", () => {
    const state = createOAuthState({ practiceId: "practice-1", practitionerId: null }, SECRET);
    const nineMinutesLater = new Date(Date.now() + 9 * 60 * 1000);
    expect(verifyOAuthState(state, SECRET, nineMinutesLater).valid).toBe(true);
  });
});
