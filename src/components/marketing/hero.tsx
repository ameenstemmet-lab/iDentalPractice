"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon, CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RevealGroup, RevealItem } from "./motion";

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
    <motion.div
      initial={{ opacity: 0, y: 32, rotate: 3 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-[0_30px_60px_-15px_color-mix(in_oklch,var(--primary)_35%,transparent)]"
      >
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
      </motion.div>

      {/* Gold accent chip, floats independently for depth. */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, y: [0, 8, 0] }}
        transition={{
          opacity: { duration: 0.6, delay: 0.9 },
          scale: { duration: 0.6, delay: 0.9 },
          y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 },
        }}
        className="absolute -top-5 -left-5 flex items-center gap-2 rounded-xl border border-gold/30 bg-card px-3.5 py-2.5 shadow-lg"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-gold/15 text-gold-foreground">
          <CheckIcon className="size-3.5" />
        </span>
        <div className="leading-tight">
          <p className="text-[11px] font-semibold text-foreground">Zero conflicts</p>
          <p className="text-[10px] text-muted-foreground">across 3 diaries</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Hero() {
  return (
    <section className="relative z-0 overflow-hidden bg-surface">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_100%_-10%,color-mix(in_oklch,var(--primary)_26%,transparent),transparent)]" />
        {/* Fine dot-grid across the whole hero, vignetted at the edges — the structured layer that keeps a gradient wash from reading as flat. */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, color-mix(in oklch, var(--primary) 20%, transparent) 1.4px, transparent 1.4px)",
            backgroundSize: "26px 26px",
            maskImage: "radial-gradient(ellipse 95% 90% at 50% 35%, black 0%, transparent 90%)",
            WebkitMaskImage: "radial-gradient(ellipse 95% 90% at 50% 35%, black 0%, transparent 90%)",
          }}
        />
        {/* Fine film-grain texture — the tactile, "designed" quality flat CSS gradients alone don't have. multiply (not overlay) so it reads against a near-white background too. */}
        <div
          className="absolute inset-0 opacity-[0.05] mix-blend-multiply"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "220px 220px",
          }}
        />
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-[-8%] size-[32rem] rounded-full bg-[color-mix(in_oklch,var(--gold)_42%,transparent)] blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 15, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 left-[-8%] size-[26rem] rounded-full bg-[color-mix(in_oklch,var(--primary)_30%,transparent)] blur-3xl"
        />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-8 lg:py-28">
        <RevealGroup>
          <RevealItem>
            <span className="inline-flex items-center rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-gold-foreground uppercase shadow-[0_0_0_1px_color-mix(in_oklch,var(--gold)_15%,transparent)]">
              For multi-specialty practices
            </span>
          </RevealItem>

          <RevealItem>
            <h1 className="mt-6 font-heading text-4xl leading-[1.08] font-semibold tracking-tight text-foreground sm:text-5xl">
              Never lose a booking to a calendar that can&apos;t keep up.
            </h1>
          </RevealItem>

          <RevealItem>
            <p className="mt-6 max-w-lg text-base text-balance text-muted-foreground sm:text-lg">
              iPractice gives every doctor, therapist, and specialist in your practice their own
              diary — synced to their own Google Calendar, bookable by patients online, and never
              double-booked with a colleague&apos;s. Set up your practice in minutes, not months.
            </p>
          </RevealItem>

          <RevealItem>
            <ul className="mt-6 flex flex-col gap-2.5">
              {PROOF_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-foreground">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                  {point}
                </li>
              ))}
            </ul>
          </RevealItem>

          <RevealItem>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="gap-2 shadow-[0_8px_24px_-4px_color-mix(in_oklch,var(--primary)_45%,transparent)] transition-shadow duration-base hover:shadow-[0_12px_32px_-4px_color-mix(in_oklch,var(--primary)_55%,transparent)]"
              >
                <Link href="/signup">
                  Start your practice — free
                  <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/book/stemmet-dental">See a live example</Link>
              </Button>
            </div>
          </RevealItem>

          <RevealItem>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card. No setup call. Add your first practitioner in under 5 minutes.
            </p>
          </RevealItem>
        </RevealGroup>

        <div className="flex justify-center lg:justify-end">
          <CalendarMockup />
        </div>
      </div>
    </section>
  );
}
