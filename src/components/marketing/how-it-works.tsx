import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "./motion";

const STEPS = [
  {
    number: "01",
    title: "Create your practice",
    body: "Your practice name and a login — that's it. No sales call, no setup fee, no waiting on an onboarding team.",
  },
  {
    number: "02",
    title: "Add your practitioners",
    body: "Any specialty. Set their working hours, what they treat, and connect their own Google Calendar if they want one.",
  },
  {
    number: "03",
    title: "Share your booking link",
    body: "Every practice gets its own page — iPractice.com/book/your-practice. Patients book straight into the right diary.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-wide text-gold-foreground uppercase">
              From signup to your first booking
            </p>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Live in one sitting.
            </h2>
          </div>
          <Button asChild className="gap-2">
            <Link href="/signup">
              Start now
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        </Reveal>

        <RevealGroup className="relative mt-14 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          <div aria-hidden className="absolute top-6 right-0 left-0 hidden h-px bg-gradient-to-r from-border via-gold/50 to-border md:block" />
          {STEPS.map((step) => (
            <RevealItem key={step.number} className="relative flex flex-col gap-3">
              <span className="flex size-12 items-center justify-center rounded-full border border-gold/30 bg-background font-heading text-sm font-semibold text-primary shadow-sm">
                {step.number}
              </span>
              <h3 className="font-heading text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.body}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
