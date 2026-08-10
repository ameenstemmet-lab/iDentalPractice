"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "./motion";

export function FinalCta() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground shadow-[0_40px_80px_-20px_color-mix(in_oklch,var(--primary)_45%,transparent)] ring-1 ring-gold/15 sm:px-10 sm:py-20">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.55, 0.3] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/15 blur-3xl"
            />
          </div>

          <div className="relative mx-auto max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-gold uppercase">Free to start</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              The next booking you almost lose is the one worth fixing this for.
            </h2>
            <p className="mt-4 text-primary-foreground/75">No credit card. Live in one sitting.</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="gap-2 bg-gold text-gold-foreground shadow-[0_8px_24px_-4px_color-mix(in_oklch,var(--gold)_50%,transparent)] hover:bg-gold/90"
              >
                <Link href="/signup">
                  Start your practice — free
                  <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/25 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
                <Link href="/book/stemmet-dental">See a live example</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
