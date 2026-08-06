import "server-only";
import { Resend } from "resend";

export interface BookingConfirmationEmailInput {
  to: string;
  patientFirstName: string;
  practiceName: string;
  practitionerName: string;
  treatmentName: string;
  dateLabel: string;
  timeLabel: string;
  reference: string;
}

function renderHtml(input: BookingConfirmationEmailInput): string {
  return `
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #111827;">
      <p style="font-size: 12px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #2563eb;">Booking confirmed</p>
      <h1 style="font-size: 22px; margin: 4px 0 16px;">You're all set, ${input.patientFirstName}</h1>
      <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">
        Your appointment with ${input.practiceName} has been confirmed. We look forward to seeing you.
      </p>
      <table style="width: 100%; margin-top: 20px; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 8px 0; color: #6b7280;">Practitioner</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${input.practitionerName}</td></tr>
        <tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 8px 0; color: #6b7280;">Treatment</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${input.treatmentName}</td></tr>
        <tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 8px 0; color: #6b7280;">Date &amp; time</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${input.dateLabel} at ${input.timeLabel}</td></tr>
      </table>
      <div style="margin-top: 24px; padding: 12px 16px; border: 1px dashed #d1d5db; border-radius: 8px;">
        <p style="margin: 0; font-size: 12px; color: #6b7280;">Reference</p>
        <p style="margin: 2px 0 0; font-family: monospace; font-size: 14px; font-weight: 600;">${input.reference}</p>
      </div>
      <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
        Need to change or cancel? Reply to this email or contact ${input.practiceName} directly.
      </p>
    </div>
  `;
}

/**
 * Best-effort — callers must not let a failure here roll back or block a
 * booking that already succeeded, matching the Google Calendar sync
 * pattern in submit-booking-action.ts.
 */
export async function sendBookingConfirmationEmail(input: BookingConfirmationEmailInput): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.BOOKING_CONFIRMATION_FROM_EMAIL ?? "iDentalPractice <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: `Booking confirmed — ${input.practiceName}`,
    html: renderHtml(input),
  });

  if (error) throw new Error(`sendBookingConfirmationEmail failed: ${error.message}`);
}
