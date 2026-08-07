"use server";

import { randomUUID } from "node:crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/auth/session";
import { sendInviteEmail } from "@/lib/email/send-invite-email";

export interface InviteResult {
  ok: boolean;
  message: string;
}

async function createInvitedUser(params: {
  email: string;
  practiceId: string;
  role: "staff" | "practitioner";
  practitionerId?: string;
}): Promise<InviteResult> {
  const session = await requireSession();
  if (session.role !== "staff") {
    return { ok: false, message: "Only staff can invite team members." };
  }

  const admin = createSupabaseAdminClient();

  const { data: practice, error: practiceError } = await admin
    .from("practices")
    .select("practice_name")
    .eq("id", session.practiceId)
    .single<{ practice_name: string }>();
  if (practiceError) return { ok: false, message: practiceError.message };

  // A throwaway password the invitee never sees — they set their own via the
  // recovery link below, the same flow "forgot password" uses.
  const { error: createError } = await admin.auth.admin.createUser({
    email: params.email,
    password: randomUUID(),
    email_confirm: true,
    app_metadata: {
      practice_id: params.practiceId,
      role: params.role,
      ...(params.practitionerId ? { practitioner_id: params.practitionerId } : {}),
    },
  });
  if (createError) {
    const message = createError.message.includes("already been registered")
      ? "Someone with that email already has an account."
      : createError.message;
    return { ok: false, message };
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: params.email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite` },
  });
  if (linkError) return { ok: false, message: linkError.message };

  try {
    await sendInviteEmail({
      to: params.email,
      practiceName: practice.practice_name,
      inviterEmail: session.email,
      role: params.role,
      actionLink: linkData.properties.action_link,
    });
  } catch (err) {
    return {
      ok: false,
      message: `Account created, but the invite email failed to send: ${err instanceof Error ? err.message : "unknown error"}`,
    };
  }

  return { ok: true, message: `Invite sent to ${params.email}.` };
}

export async function inviteStaffMemberAction(email: string): Promise<InviteResult> {
  const session = await requireSession();
  return createInvitedUser({ email, practiceId: session.practiceId, role: "staff" });
}

export async function invitePractitionerToLoginAction(practitionerId: string, email: string): Promise<InviteResult> {
  const session = await requireSession();
  return createInvitedUser({ email, practiceId: session.practiceId, role: "practitioner", practitionerId });
}
