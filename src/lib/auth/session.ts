import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type StaffRole = "staff" | "practitioner";

export interface CurrentSession {
  userId: string;
  email: string;
  practiceId: string;
  role: StaffRole;
  /** Set only when role === "practitioner" — links this login to their own practitioners row. */
  practitionerId: string | null;
}

interface AppMetadata {
  practice_id?: string;
  role?: StaffRole;
  practitioner_id?: string;
}

/**
 * The one place that reads app_metadata off the JWT — every practice-scoped
 * server action/page derives practiceId from here, never from a
 * client-supplied value. app_metadata is only ever set server-side (via the
 * service-role admin API at signup/invite time), so a client can't forge it.
 */
export async function getCurrentSession(): Promise<CurrentSession | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const metadata = user.app_metadata as AppMetadata;
  if (!metadata.practice_id || !metadata.role) return null;

  return {
    userId: user.id,
    email: user.email ?? "",
    practiceId: metadata.practice_id,
    role: metadata.role,
    practitionerId: metadata.practitioner_id ?? null,
  };
}

/** For pages/actions that require a signed-in session — throws instead of silently no-op-ing on null. */
export async function requireSession(): Promise<CurrentSession> {
  const session = await getCurrentSession();
  if (!session) throw new Error("Not authenticated.");
  return session;
}

/**
 * The real tenant-isolation boundary for every practice-scoped server
 * action: `practiceId` arrives as a plain function argument (the client
 * already has it via context), but it's cross-checked against the caller's
 * own session here rather than trusted — the only thing that actually stops
 * a crafted request from one practice reading or writing another's data.
 */
export async function assertPracticeAccess(practiceId: string): Promise<CurrentSession> {
  const session = await requireSession();
  if (session.practiceId !== practiceId) {
    throw new Error("You don't have permission to access this practice's data.");
  }
  return session;
}
