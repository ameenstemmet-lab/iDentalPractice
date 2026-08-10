"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarSyncIcon, CheckIcon, ShieldCheckIcon, StethoscopeIcon, UserCheckIcon, ZapIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "./motion";

const REASONS = [
  { icon: StethoscopeIcon, title: "Built for any specialty", description: "Dentist, GP, physio, psychiatrist — add whoever you employ, no fixed list." },
  { icon: UserCheckIcon, title: "One diary per practitioner", description: "Every doctor's calendar is their own — no more double-bookings across colleagues." },
  { icon: CalendarSyncIcon, title: "Syncs to Google Calendar", description: "Each practitioner can connect their own calendar independently." },
  { icon: ShieldCheckIcon, title: "Practice-only login", description: "Your data belongs to your practice — no one else can see it, ever." },
] as const;

const PATIENT_FLOW = [
  { icon: StethoscopeIcon, label: "Picks their practitioner" },
  { icon: ZapIcon, label: "Sees real availability, instantly" },
  { icon: CheckIcon, label: "Confirms — no phone call needed" },
] as const;

export function WhyChoose() {
  return (
    <section id="about" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="grid grid-cols-1 overflow-hidden rounded-3xl bg-primary text-primary-foreground shadow-[0_40px_80px_-20px_color-mix(in_oklch,var(--primary)_45%,transparent)] ring-1 ring-gold/15 lg:grid-cols-2">
          <div className="flex flex-col justify-center gap-6 px-6 py-14 sm:px-10 lg:px-14">
            <p className="text-xs font-semibold tracking-wide text-gold uppercase">Why practices switch</p>
            <h2 className="font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              Built for how a real multi-specialty practice actually runs.
            </h2>

            <RevealGroup className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {REASONS.map(({ icon: Icon, title, description }) => (
                <RevealItem key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <Icon className="size-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-0.5 text-sm text-primary-foreground/70">{description}</p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>

          <div className="relative flex flex-col justify-center gap-6 bg-[color-mix(in_oklch,var(--primary)_85%,black)] px-6 py-14 sm:px-10 lg:px-14">
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40">
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-8 right-8 size-40 rounded-full bg-gold/20 blur-2xl"
              />
            </div>

            <div className="relative rounded-2xl bg-background p-6 text-foreground shadow-xl">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ZapIcon className="size-4.5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">This is what your patients see</p>
                  <p className="text-xs text-muted-foreground">No app to download, no account required.</p>
                </div>
              </div>

              <ul className="mt-5 flex flex-col gap-3">
                {PATIENT_FLOW.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-2.5 text-sm text-foreground">
                    <Icon className="size-4 text-primary" />
                    {label}
                  </li>
                ))}
              </ul>

              <Button asChild className="mt-6 w-full gap-1.5">
                <Link href="/book/stemmet-dental">
                  <CheckIcon className="size-4" />
                  Try the live example
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
