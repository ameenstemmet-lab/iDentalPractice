"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { assertPracticeAccess } from "@/lib/auth/session";

export interface TeamMember {
  id: string;
  email: string;
  role: "staff" | "practitioner";
  practitionerId: string | null;
  createdAt: string;
}

/**
 * Lists everyone with a login for this practice. The admin Auth API has no
 * server-side filter for arbitrary app_metadata, so this fetches and
 * filters in memory — perfectly fine at the team sizes a single practice
 * actually has, revisit with pagination only if that stops being true.
 */
export async function listTeamMembersAction(practiceId: string): Promise<TeamMember[]> {
  await assertPracticeAccess(practiceId);
  const admin = createSupabaseAdminClient();

  const members: TeamMember[] = [];
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listTeamMembersAction failed: ${error.message}`);

    for (const user of data.users) {
      const metadata = user.app_metadata as { practice_id?: string; role?: "staff" | "practitioner"; practitioner_id?: string };
      if (metadata.practice_id === practiceId && metadata.role) {
        members.push({
          id: user.id,
          email: user.email ?? "",
          role: metadata.role,
          practitionerId: metadata.practitioner_id ?? null,
          createdAt: user.created_at,
        });
      }
    }

    if (data.users.length < perPage) break;
    page += 1;
  }

  return members.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
