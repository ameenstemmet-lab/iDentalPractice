import type { AppointmentSyncDataSource } from "../repository/appointment-sync-datasource";
import type { AppointmentSyncPayload } from "../types";

export class InMemoryAppointmentSyncDataSource implements AppointmentSyncDataSource {
  private payloads = new Map<string, AppointmentSyncPayload>();
  private googleEventIds = new Map<string, string | null>();

  seed(payload: AppointmentSyncPayload) {
    this.payloads.set(payload.appointmentId, payload);
  }

  async getSyncPayload(appointmentId: string): Promise<AppointmentSyncPayload | null> {
    return this.payloads.get(appointmentId) ?? null;
  }

  async setGoogleEventId(appointmentId: string, googleEventId: string | null): Promise<void> {
    this.googleEventIds.set(appointmentId, googleEventId);
    const existing = this.payloads.get(appointmentId);
    if (existing) this.payloads.set(appointmentId, { ...existing, existingGoogleEventId: googleEventId });
  }

  getStoredGoogleEventId(appointmentId: string): string | null | undefined {
    return this.googleEventIds.get(appointmentId);
  }
}
