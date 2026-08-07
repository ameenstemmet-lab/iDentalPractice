import Link from "next/link";
import { ArrowRightIcon, CalendarCheckIcon, ShieldCheckIcon, SparklesIcon, UsersIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

const TRUST_BADGES = [
  { icon: UsersIcon, label: "20+ specialists" },
  { icon: ShieldCheckIcon, label: "Medical aids accepted" },
  { icon: SparklesIcon, label: "Modern facilities" },
  { icon: CalendarCheckIcon, label: "Easy online booking" },
] as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Soft abstract gradient field — stands in for hero photography, keeps the
          "premium, warm, never generic" brief without a stock-photo placeholder. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent)]" />
        <div className="absolute -top-24 right-[-10%] size-[32rem] rounded-full bg-[color-mix(in_oklch,var(--gold)_28%,transparent)] blur-3xl" />
        <div className="absolute top-40 left-[-15%] size-[28rem] rounded-full bg-[color-mix(in_oklch,var(--primary)_18%,transparent)] blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-gold-foreground uppercase">
            <SparklesIcon className="size-3.5 text-gold" />
            Welcome to iPractice
          </span>

          <h1 className="mt-6 font-heading text-4xl leading-[1.05] font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]">
            Expert Care.
            <br />
            All in <span className="text-gold-foreground italic">One</span> Place.
          </h1>

          <p className="mt-6 max-w-xl text-base text-balance text-muted-foreground sm:text-lg">
            A multi-disciplinary medical practice providing comprehensive healthcare for you and your
            family — delivered by experienced specialists under one roof. Your health, our priority.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link href="/booking">
                Book Appointment
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#doctors">Meet Our Doctors</a>
            </Button>
          </div>

          <div className="mt-14 grid w-full grid-cols-2 gap-x-6 gap-y-5 border-t border-border pt-8 sm:grid-cols-4">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 text-center">
                <Icon className="size-5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
