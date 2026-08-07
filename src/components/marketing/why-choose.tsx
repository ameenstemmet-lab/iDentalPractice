import Link from "next/link";
import { CalendarIcon, CheckIcon, ClockIcon, ShieldCheckIcon, UserCheckIcon, UsersIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

const REASONS = [
  { icon: UsersIcon, title: "Multi-disciplinary care", description: "A team of specialists working together for your wellbeing." },
  { icon: ShieldCheckIcon, title: "Comprehensive services", description: "Everything you need, under one roof." },
  { icon: UserCheckIcon, title: "Personalised approach", description: "We take the time to listen and understand you." },
  { icon: CalendarIcon, title: "Easy & convenient", description: "Online bookings and flexible appointment times." },
] as const;

const BOOKING_STEPS = [
  { icon: UserCheckIcon, label: "Choose a service" },
  { icon: UsersIcon, label: "Select your preferred doctor" },
  { icon: ClockIcon, label: "Pick a date and time" },
] as const;

export function WhyChoose() {
  return (
    <section id="about" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 overflow-hidden rounded-3xl bg-primary text-primary-foreground lg:grid-cols-2">
          <div className="flex flex-col justify-center gap-6 px-6 py-14 sm:px-10 lg:px-14">
            <p className="text-xs font-semibold tracking-wide text-gold uppercase">Why choose iPractice</p>
            <h2 className="font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              Healthcare you can trust. People who care.
            </h2>

            <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {REASONS.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <Icon className="size-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-0.5 text-sm text-primary-foreground/70">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex flex-col justify-center gap-6 bg-[color-mix(in_oklch,var(--primary)_85%,black)] px-6 py-14 sm:px-10 lg:px-14">
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40">
              <div className="absolute top-8 right-8 size-40 rounded-full bg-gold/20 blur-2xl" />
            </div>

            <div className="relative rounded-2xl bg-background p-6 text-foreground shadow-xl">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CalendarIcon className="size-4.5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Book an appointment</p>
                  <p className="text-xs text-muted-foreground">Quick and easy, at your convenience.</p>
                </div>
              </div>

              <ul className="mt-5 flex flex-col gap-3">
                {BOOKING_STEPS.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-2.5 text-sm text-foreground">
                    <Icon className="size-4 text-primary" />
                    {label}
                  </li>
                ))}
              </ul>

              <Button asChild className="mt-6 w-full gap-1.5">
                <Link href="/booking">
                  <CheckIcon className="size-4" />
                  Book Now
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
