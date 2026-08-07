"use client";

import * as React from "react";
import Link from "next/link";
import { MenuIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Specialties", href: "#services" },
  { label: "Why iPractice", href: "#about" },
  { label: "FAQ", href: "#faq" },
] as const;

export function MarketingNav() {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      id="home"
      className={cn(
        "sticky top-0 z-40 transition-all duration-base",
        scrolled
          ? "border-b border-border bg-background/85 backdrop-blur-glass shadow-xs"
          : "border-b border-transparent bg-background/60 backdrop-blur-glass"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="#home" className="flex shrink-0 items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-heading text-sm font-semibold text-primary-foreground">
            iP
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-heading text-base font-semibold tracking-tight text-foreground">
              iPractice
            </span>
            <span className="text-[10px] tracking-wide text-muted-foreground uppercase">
              Scheduling for multi-specialty practices
            </span>
          </span>
        </Link>

        <nav className="ml-4 hidden flex-1 items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-fast hover:bg-accent hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <Button asChild variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild className="gap-1.5">
            <Link href="/signup">Start your practice</Link>
          </Button>
        </div>

        <button
          type="button"
          className="ml-auto flex size-9 items-center justify-center rounded-md text-foreground lg:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-border bg-background px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild className="flex-1 gap-1.5">
              <Link href="/signup">Start free</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
