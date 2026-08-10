import Link from "next/link";
import { ArrowRightIcon, GraduationCapIcon } from "lucide-react";

import type { Practitioner } from "@/features/booking/types";
import { Reveal, RevealGroup, RevealItem } from "./motion";

export function FeaturedDoctors({ practitioners }: { practitioners: Practitioner[] }) {
  if (practitioners.length === 0) return null;

  return (
    <section id="doctors" className="bg-surface py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-xl">
          <p className="text-xs font-semibold tracking-wide text-gold-foreground uppercase">
            Not a mockup — a real practice
          </p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Stemmet Dental runs three specialties on iPractice today.
          </h2>
          <p className="mt-4 text-muted-foreground">
            A dentist, a GP, and a physiotherapist — each with their own diary, each bookable
            independently at{" "}
            <Link href="/book/stemmet-dental" className="font-medium text-primary hover:underline">
              /book/stemmet-dental
            </Link>
            .
          </p>
        </Reveal>

        <RevealGroup className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {practitioners.map((p) => {
            const initials = `${p.firstName[0]}${p.lastName[0]}`.toUpperCase();
            return (
              <RevealItem
                key={p.id}
                className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center shadow-xs transition-all duration-base hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary ring-4 ring-gold/10">
                  {initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {p.title ? `${p.title} ` : ""}
                    {p.firstName} {p.lastName}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-gold-foreground">{p.profession}</p>
                </div>
                {p.qualification ? (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <GraduationCapIcon className="size-3 shrink-0" />
                    {p.qualification}
                  </p>
                ) : null}
              </RevealItem>
            );
          })}
        </RevealGroup>

        <Link
          href="/book/stemmet-dental"
          className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          See their live booking page
          <ArrowRightIcon className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}
