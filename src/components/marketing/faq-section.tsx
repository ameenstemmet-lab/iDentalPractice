import { PlusIcon } from "lucide-react";

import { Reveal, RevealGroup, RevealItem } from "./motion";

const FAQS = [
  {
    question: "What does it cost?",
    answer:
      "iPractice is free to start while we're in early access — create your practice, add your practitioners, and take bookings with no card required. We'll give existing practices plenty of notice before any pricing changes.",
  },
  {
    question: "Does my specialty need to be supported already?",
    answer:
      "No. Profession is a free-text field you fill in when you add a practitioner — dentist, GP, physiotherapist, psychiatrist, optometrist, anything. There's no list to be missing from.",
  },
  {
    question: "Can a practitioner see only their own appointments?",
    answer:
      "Yes. Invite them from the Practitioners page and they get their own login, scoped to their own diary — they never see the rest of the practice's admin pages unless you make them staff instead.",
  },
  {
    question: "Does this replace our Google Calendar?",
    answer:
      "No — it syncs to it. Each practitioner can connect their own Google Calendar independently, or the whole practice can share one. Supabase (our database) stays the source of truth; Google is always a synced view of it, never the other way around.",
  },
  {
    question: "Who can see our patient data?",
    answer:
      "Only logins that belong to your practice. Every request is checked against the signed-in user's own practice — there's no way for one practice's staff to query another's data, by design, not just by convention.",
  },
  {
    question: "How long does setup actually take?",
    answer:
      "Signup creates your practice and login immediately. Adding your first practitioner and their working hours takes a few minutes. There's no onboarding call to book.",
  },
] as const;

export function FaqSection() {
  return (
    <section id="faq" className="bg-surface py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <p className="text-xs font-semibold tracking-wide text-gold-foreground uppercase">Before you sign up</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Questions practice owners actually ask
          </h2>
        </Reveal>

        <RevealGroup className="mt-12 flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {FAQS.map((faq) => (
            <RevealItem key={faq.question}>
              <details className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-foreground marker:content-none">
                  {faq.question}
                  <PlusIcon className="size-4 shrink-0 text-primary transition-transform duration-base group-open:rotate-45" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{faq.answer}</p>
              </details>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
