import { describe, expect, it, vi } from "vitest";
import { GoogleCalendarApiClient } from "./calendar-api-client";
import { GoogleApiError } from "./google-api-error";

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });
}

describe("GoogleCalendarApiClient.listCalendars", () => {
  it("returns the calendar list", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(200, { items: [{ id: "primary", summary: "Main", primary: true }] })
    );
    const client = new GoogleCalendarApiClient({ fetchImpl });

    const calendars = await client.listCalendars("token-1");

    expect(calendars).toEqual([{ id: "primary", summary: "Main", primary: true }]);
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("/users/me/calendarList"),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer token-1" }) })
    );
  });
});

describe("GoogleCalendarApiClient.insertEvent", () => {
  it("POSTs to the events endpoint and tags the event with the appointment id", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        id: "evt-1",
        summary: "Cleaning — Jane Doe",
        status: "confirmed",
        start: { dateTime: "2026-08-10T09:00:00Z" },
        end: { dateTime: "2026-08-10T09:30:00Z" },
        extendedProperties: { private: { idp_appointment_id: "appt-1" } },
      })
    );
    const client = new GoogleCalendarApiClient({ fetchImpl });

    const event = await client.insertEvent("token-1", "primary", "appt-1", {
      summary: "Cleaning — Jane Doe",
      start: new Date("2026-08-10T09:00:00Z"),
      end: new Date("2026-08-10T09:30:00Z"),
      timezone: "Africa/Johannesburg",
    });

    expect(event.id).toBe("evt-1");
    expect(event.isOwnedByUs).toBe(true);

    const [, init] = fetchImpl.mock.calls[0];
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body.extendedProperties.private.idp_appointment_id).toBe("appt-1");
  });
});

describe("GoogleCalendarApiClient.updateEvent — the PATCH-not-PUT fix", () => {
  it("uses PATCH, not PUT, so the ownership tag survives without being re-sent", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        id: "evt-1",
        summary: "Updated",
        status: "confirmed",
        start: { dateTime: "2026-08-10T10:00:00Z" },
        end: { dateTime: "2026-08-10T10:30:00Z" },
      })
    );
    const client = new GoogleCalendarApiClient({ fetchImpl });

    await client.updateEvent("token-1", "primary", "evt-1", {
      summary: "Updated",
      start: new Date("2026-08-10T10:00:00Z"),
      end: new Date("2026-08-10T10:30:00Z"),
      timezone: "Africa/Johannesburg",
    });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(init.method).toBe("PATCH");
    expect(url).toContain("/events/evt-1");
    // The update body must NOT include extendedProperties — PATCH only
    // touches what's sent, so omitting it is what preserves the tag.
    const body = JSON.parse(init.body);
    expect(body.extendedProperties).toBeUndefined();
  });
});

describe("GoogleCalendarApiClient.cancelEvent", () => {
  it("PATCHes status to cancelled rather than hard-deleting", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, {}));
    const client = new GoogleCalendarApiClient({ fetchImpl });

    await client.cancelEvent("token-1", "primary", "evt-1");

    const [, init] = fetchImpl.mock.calls[0];
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({ status: "cancelled" });
  });
});

describe("GoogleCalendarApiClient error handling", () => {
  it("throws GoogleApiError with status and reason on failure", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(404, { error: { message: "Not Found", errors: [{ reason: "notFound" }] } })
    );
    const client = new GoogleCalendarApiClient({ fetchImpl });

    await expect(client.cancelEvent("token-1", "primary", "missing-evt")).rejects.toMatchObject({
      status: 404,
      reason: "notFound",
    });
  });

  it("captures Retry-After for rate limit responses", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(429, { error: { message: "Too many requests" } }, { "Retry-After": "30" })
    );
    const client = new GoogleCalendarApiClient({ fetchImpl });

    try {
      await client.listCalendars("token-1");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(GoogleApiError);
      const apiError = err as GoogleApiError;
      expect(apiError.isRateLimited).toBe(true);
      expect(apiError.retryAfterSeconds).toBe(30);
    }
  });

  it("distinguishes a genuine 403 permission error from rate limiting", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(403, { error: { message: "Forbidden", errors: [{ reason: "insufficientPermissions" }] } })
    );
    const client = new GoogleCalendarApiClient({ fetchImpl });

    try {
      await client.listCalendars("token-1");
      expect.unreachable("should have thrown");
    } catch (err) {
      const apiError = err as GoogleApiError;
      expect(apiError.isRateLimited).toBe(false);
    }
  });
});
