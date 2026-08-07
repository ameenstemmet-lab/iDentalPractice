import "server-only";
import { Resend } from "resend";

export interface InviteEmailInput {
  to: string;
  practiceName: string;
  inviterEmail: string;
  role: "staff" | "practitioner";
  actionLink: string;
}

function renderHtml(input: InviteEmailInput): string {
  const roleLabel = input.role === "practitioner" ? "practitioner" : "staff member";
  return `
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #111827;">
      <p style="font-size: 12px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #0F2747;">You're invited</p>
      <h1 style="font-size: 22px; margin: 4px 0 16px;">Join ${input.practiceName} on iPractice</h1>
      <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">
        ${input.inviterEmail} has invited you to join ${input.practiceName} as a ${roleLabel}. Click below to
        set your password and get started.
      </p>
      <a href="${input.actionLink}" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #0F2747; color: #ffffff; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
        Accept invitation
      </a>
      <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
        If you weren't expecting this invitation, you can safely ignore this email.
      </p>
    </div>
  `;
}

/** Best-effort — matches the pattern in send-booking-confirmation-email.ts. */
export async function sendInviteEmail(input: InviteEmailInput): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.BOOKING_CONFIRMATION_FROM_EMAIL ?? "iPractice <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: `You're invited to join ${input.practiceName} on iPractice`,
    html: renderHtml(input),
  });

  if (error) throw new Error(`sendInviteEmail failed: ${error.message}`);
}
