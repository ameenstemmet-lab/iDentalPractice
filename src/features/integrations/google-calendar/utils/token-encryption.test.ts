import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decryptToken, encryptToken, loadEncryptionKey } from "./token-encryption";

const KEY = randomBytes(32);

describe("loadEncryptionKey", () => {
  it("accepts a valid 32-byte base64 key", () => {
    const key = loadEncryptionKey(KEY.toString("base64"));
    expect(key.length).toBe(32);
  });

  it("rejects a key of the wrong length", () => {
    expect(() => loadEncryptionKey(randomBytes(16).toString("base64"))).toThrow();
  });
});

describe("encryptToken / decryptToken", () => {
  it("round-trips a plaintext token", () => {
    const plaintext = "ya29.a0AfH6SMBexampleaccesstoken";
    const encrypted = encryptToken(plaintext, KEY);
    expect(encrypted).not.toContain(plaintext);
    expect(decryptToken(encrypted, KEY)).toBe(plaintext);
  });

  it("produces different ciphertext for the same plaintext each time (random IV)", () => {
    const a = encryptToken("same-token", KEY);
    const b = encryptToken("same-token", KEY);
    expect(a).not.toBe(b);
  });

  it("fails to decrypt with the wrong key", () => {
    const encrypted = encryptToken("secret", KEY);
    expect(() => decryptToken(encrypted, randomBytes(32))).toThrow();
  });

  it("fails to decrypt tampered ciphertext (GCM auth tag catches it)", () => {
    const encrypted = encryptToken("secret", KEY);
    const bytes = Buffer.from(encrypted, "base64");
    bytes[bytes.length - 1] ^= 0xff; // flip a bit in the ciphertext
    expect(() => decryptToken(bytes.toString("base64"), KEY)).toThrow();
  });

  it("rejects malformed/truncated input", () => {
    expect(() => decryptToken("dG9vc2hvcnQ=", KEY)).toThrow();
  });
});
