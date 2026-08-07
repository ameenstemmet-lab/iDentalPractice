"use server";

import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  setPasswordSchema,
  signUpSchema,
} from "./schemas";

export interface AuthActionError {
  ok: false;
  message: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  const admin = createSupabaseAdminClient();
  const cleanBase = base || "practice";
  let slug = cleanBase;
  let attempt = 1;
  while (true) {
    const { data } = await admin.from("practices").select("id").eq("slug", slug).maybeSingle<{ id: string }>();
    if (!data) return slug;
    attempt += 1;
    slug = `${cleanBase}-${attempt}`;
  }
}

/**
 * Creates a new practice + its owner login in one flow, then signs the
 * owner in immediately. Rolls back the practice row if account creation
 * fails, so a partial signup never leaves an orphaned practice with no
 * way to log in.
 */
export async function signUpAction(input: unknown): Promise<AuthActionError | never> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }
  const { practiceName, yourName, email, password } = parsed.data;

  const admin = createSupabaseAdminClient();
  const slug = await uniqueSlug(slugify(practiceName));

  const { data: practice, error: practiceError } = await admin
    .from("practices")
    .insert({ practice_name: practiceName, slug, email, timezone: "Africa/Johannesburg" })
    .select("id")
    .single<{ id: string }>();

  if (practiceError) {
    const message = practiceError.message.includes("practices_email_key")
      ? "An account with that email already exists."
      : `Could not create practice: ${practiceError.message}`;
    return { ok: false, message };
  }

  const { error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: yourName },
    app_metadata: { practice_id: practice.id, role: "staff" },
  });

  if (userError) {
    await admin.from("practices").delete().eq("id", practice.id);
    return { ok: false, message: userError.message };
  }

  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    return { ok: false, message: "Account created — please sign in." };
  }

  redirect("/dashboard");
}

export async function loginAction(input: unknown): Promise<AuthActionError | never> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { ok: false, message: "Incorrect email or password." };
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<never> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordResetAction(input: unknown): Promise<AuthActionError | { ok: true }> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const supabase = await createSupabaseServerClient();
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite`;
  // Never reveals whether the email exists — Supabase itself no-ops silently
  // for unknown addresses, which is the correct behavior here too.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo });
  return { ok: true };
}

/** Shared by both "forgot password" and "accept invite" — both land the user in an already-authenticated recovery session before calling this. */
export async function setPasswordAction(input: unknown): Promise<AuthActionError | never> {
  const parsed = setPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { ok: false, message: error.message };
  }

  redirect("/dashboard");
}
