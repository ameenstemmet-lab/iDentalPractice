"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpIcon, CalendarCheckIcon, MessageCircleIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function FloatingActions() {
  const [showBackToTop, setShowBackToTop] = React.useState(false);

  React.useEffect(() => {
    function onScroll() {
      setShowBackToTop(window.scrollY > 600);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Desktop: small floating stack, bottom-right. */}
      <div className="fixed right-5 bottom-5 z-40 hidden flex-col items-end gap-3 sm:flex">
        <a
          href="https://wa.me/27211234567"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="flex size-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-base hover:scale-105"
        >
          <MessageCircleIcon className="size-5.5" fill="currentColor" strokeWidth={0} />
        </a>
        <button
          type="button"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={cn(
            "flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-all duration-base",
            showBackToTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
          )}
        >
          <ArrowUpIcon className="size-4" />
        </button>
      </div>

      {/* Mobile: sticky bottom booking bar instead of a floating bubble — higher-converting, less clutter. */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-glass sm:hidden">
        <a
          href="https://wa.me/27211234567"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white"
        >
          <MessageCircleIcon className="size-4.5" fill="currentColor" strokeWidth={0} />
        </a>
        <Link
          href="/booking"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <CalendarCheckIcon className="size-4" />
          Book Appointment
        </Link>
      </div>
    </>
  );
}
