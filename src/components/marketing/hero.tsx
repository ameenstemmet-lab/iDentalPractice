import Link from "next/link";
import { ArrowRightIcon, CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

const PROOF_POINTS = [
  "Any specialty — dentist, GP, physio, psychiatrist, anyone",
  "Every practitioner gets their own diary, never a shared mess",
  "Patients book themselves online, 24/7",
] as const;

const MOCK_COLUMNS = [
  {
    name: "Dr. Naidoo",
    role: "Dentist",
    colour: "#2563EB",
    slots: [
      { time: "09:00", label: "Extraction", filled: true },
      { time: "09:30", label: "", filled: false },
      { time: "10:00", label: "Consultation", filled: true },
    ],
  },
  {
    name: "Dr. Khumalo",
    role: "GP",
    colour: "#059669",
    slots: [
      { time: "09:00", label: "", filled: false },
      { time: "09:30", label: "Check-up", filled: true },
      { time: "10:00", label: "Follow-up", filled: true },
    ],
  },
  {
    name: "M. Botha",
    role: "Physio",
    colour: "#DB2777",
    slots: [
      { time: "09:00", label: "Assessment", filled: true },
      { time: "09:30", label: "Session", filled: true },
      { time: "10:00", label: "", filled: false },
    ],
  },
] as const;

function CalendarMockup() {
  return (
    <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
        <span className="size-2.5 rounded-full bg-destructive/40" />
        <span className="size-2.5 rounded-full bg-warning/50" />
        <span className="size-2.5 rounded-full bg-success/50" />
        <span className="ml-2 text-xs font-medium text-muted-foreground">Today · 3 practitioners</span>
      </div>
      <div className="grid grid-cols-3 gap-px bg-border p-px">
        {MOCK_COLUMNS.map((col) => (
          <div key={col.name} className="flex flex-col gap-1.5 bg-card p-2.5">
            <div className="flex items-center gap-1.5 pb-1">
              <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: col.colour }} />
              <p className="truncate text-[11px] font-semibold text-foreground">{col.name}</p>
            </div>
            {col.slots.map((slot, i) => (
              <div
                key={i}
                className="rounded-md px-1.5 py-1.5 text-[10px] leading-tight"
                style={
                  slot.filled
                    ? { backgroundColor: `${col.colour}1a`, borderLeft: `2px solid ${col.colour}` }
                    : { border: "1px dashed var(--border)" }
                }
              >
                <span className="block font-medium text-muted-foreground">{slot.time}</span>
                {slot.filled ? <span className="block text-foreground">{slot.label}</span> : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_100%_-10%,color-mix(in_oklch,var(--primary)_9%,transparent),transparent)]" />
        <div className="absolute top-1/3 right-[-15%] size-[30rem] rounded-full bg-[color-mix(in_oklch,var(--gold)_22%,transparent)] blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-8 lg:py-28">
        <div>
          <span className="inline-flex items-center rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-gold-foreground uppercase">
            For multi-specialty practices
          </span>

          <h1 className="mt-6 font-heading text-4xl leading-[1.08] font-semibold tracking-tight text-foreground sm:text-5xl">
            Never lose a booking to a calendar that can&apos;t keep up.
          </h1>

          <p className="mt-6 max-w-lg text-base text-balance text-muted-foreground sm:text-lg">
            iPractice gives every doctor, therapist, and specialist in your practice their own
            diary — synced to their own Google Calendar, bookable by patients online, and never
            double-booked with a colleague&apos;s. Set up your practice in minutes, not months.
          </p>

          <ul className="mt-6 flex flex-col gap-2.5">
            {PROOF_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm text-foreground">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                {point}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link href="/signup">
                Start your practice — free
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/book/stemmet-dental">See a live example</Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            No credit card. No setup call. Add your first practitioner in under 5 minutes.
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <CalendarMockup />
        </div>
      </div>
    </section>
  );
}
