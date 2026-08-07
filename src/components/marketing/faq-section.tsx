import { PlusIcon } from "lucide-react";

const FAQS = [
  {
    question: "Do I need a referral to book an appointment?",
    answer:
      "No referral is needed for most specialities — you can book directly online. Some specialist services may recommend a referral from your GP for continuity of care, which our reception team can advise on.",
  },
  {
    question: "Which medical aids do you accept?",
    answer:
      "We accept most major medical aid schemes. Contact reception before your visit to confirm your specific plan and any co-payment that may apply.",
  },
  {
    question: "Can I book more than one specialist in a single visit?",
    answer:
      "Yes — since every specialist has their own independent diary, you can book back-to-back appointments with different practitioners on the same day where availability allows.",
  },
  {
    question: "What should I bring to my first appointment?",
    answer:
      "Please bring a valid ID, your medical aid card (if applicable), and a list of any current medication. Arriving 10 minutes early helps keep the day running on time for everyone.",
  },
  {
    question: "How do I cancel or reschedule?",
    answer:
      "Use the link in your booking confirmation email, or contact reception directly. We appreciate as much notice as possible so the slot can be offered to another patient.",
  },
] as const;

export function FaqSection() {
  return (
    <section id="patient-info" className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold tracking-wide text-gold-foreground uppercase">
            Patient information
          </p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>

        <div className="mt-12 flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group px-6 py-5 first:rounded-t-2xl last:rounded-b-2xl">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-foreground marker:content-none">
                {faq.question}
                <PlusIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-base group-open:rotate-45" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
