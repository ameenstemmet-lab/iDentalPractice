/**
 * Every event we create is tagged via Google's `extendedProperties.private`
 * with the appointment it came from. ConflictDetectionService uses this to
 * exclude our own synced events when scanning for *external* conflicts —
 * without it, every appointment would "conflict" with its own event.
 */

const TAG_KEY = "idp_appointment_id";

export interface ExtendedProperties {
  private?: Record<string, string>;
}

export function buildOwnershipExtendedProperties(appointmentId: string): ExtendedProperties {
  return { private: { [TAG_KEY]: appointmentId } };
}

export function isOwnedByUs(extendedProperties: ExtendedProperties | undefined): boolean {
  return Boolean(extendedProperties?.private?.[TAG_KEY]);
}

export function getTaggedAppointmentId(extendedProperties: ExtendedProperties | undefined): string | null {
  return extendedProperties?.private?.[TAG_KEY] ?? null;
}
