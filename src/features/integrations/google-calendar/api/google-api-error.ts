const RATE_LIMIT_REASONS = new Set(["rateLimitExceeded", "userRateLimitExceeded", "quotaExceeded"]);

/** Thrown for any non-2xx response from Google's APIs — carries enough detail for callers to branch on. */
export class GoogleApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    /** Google's machine-readable error reason (e.g. "rateLimitExceeded", "notFound"), when present. */
    public readonly reason?: string,
    public readonly retryAfterSeconds?: number
  ) {
    super(message);
    this.name = "GoogleApiError";
  }

  get isAuthError(): boolean {
    return this.status === 401;
  }

  get isNotFound(): boolean {
    return this.status === 404 || this.status === 410;
  }

  /** 429 is unambiguous; a 403 is only rate-limiting if Google's reason says so — otherwise it's a real permission error. */
  get isRateLimited(): boolean {
    return this.status === 429 || (this.status === 403 && Boolean(this.reason && RATE_LIMIT_REASONS.has(this.reason)));
  }
}
