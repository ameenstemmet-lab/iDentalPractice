import { CalendarXIcon, MessageSquareOffIcon, PhoneMissedIcon } from "lucide-react";

const SCENARIOS = [
  {
    icon: PhoneMissedIcon,
    stat: "After hours",
    title: "The call comes in at 7pm",
    body: "Reception's gone home. The patient tries the next practice on the list instead, and books with them.",
  },
  {
    icon: CalendarXIcon,
    stat: "Two calendars, one slot",
    title: "Two receptionists, one paper diary",
    body: "Both write 2pm Thursday for different patients. Someone finds out when they're both standing in reception.",
  },
  {
    icon: MessageSquareOffIcon,
    stat: "No shared view",
    title: "Your physio doesn't know what your GP booked",
    body: "Every practitioner keeps their own list. Nobody can see the whole practice's day at a glance.",
  },
] as const;

export function PainPoints() {
  return (
    <section className="border-y border-border bg-surface py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <p className="text-xs font-semibold tracking-wide text-gold-foreground uppercase">Sound familiar?</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Every one of these is a booking you didn&apos;t need to lose.
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
          {SCENARIOS.map(({ icon: Icon, stat, title, body }) => (
            <div key={title} className="flex flex-col gap-4 bg-card p-7">
              <Icon className="size-6 text-destructive/70" />
              <p className="text-xs font-semibold tracking-wide text-destructive/70 uppercase">{stat}</p>
              <div>
                <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
