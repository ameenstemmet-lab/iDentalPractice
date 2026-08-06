import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center px-4 sm:px-6">
        <span className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
          <span className="flex size-6 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
            iD
          </span>
          iDentalPractice
        </span>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <p className="text-xs font-medium tracking-wide text-primary uppercase">
          Modern dental care
        </p>
        <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Booking your visit should feel this easy.
        </h1>
        <p className="mt-4 max-w-md text-base text-muted-foreground">
          Choose your dentist, treatment, and time in a few effortless steps.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/booking">Reserve Your Visit</Link>
        </Button>
      </main>
    </div>
  );
}
