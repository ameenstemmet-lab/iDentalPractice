import { Reveal, RevealGroup, RevealItem } from "./motion";

interface ExampleTestimonial {
  quote: string;
  author: string;
  role: string;
}

// Placeholder copy, not real practice feedback — swap in real quotes from
// your own customers once you have them.
const EXAMPLE_TESTIMONIALS: ExampleTestimonial[] = [
  {
    quote: "We used to lose Thursday-evening bookings because reception had already left. Now they come in overnight and we just see them the next morning.",
    author: "Example practice owner",
    role: "Multi-practitioner clinic",
  },
  {
    quote: "Adding our physiotherapist took ten minutes. I expected to need a support ticket for that.",
    author: "Example practice owner",
    role: "Dental practice, added a second specialty",
  },
  {
    quote: "Every practitioner has their own Google Calendar now. Nobody's double-booked anymore, and nobody had to change how they check their own diary.",
    author: "Example practice owner",
    role: "GP practice",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-xl">
          <p className="text-xs font-semibold tracking-wide text-gold-foreground uppercase">
            From practices already on iPractice
          </p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            What changes in the first week
          </h2>
        </Reveal>

        <RevealGroup className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {EXAMPLE_TESTIMONIALS.map((t) => (
            <RevealItem
              key={t.quote}
              className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-xs"
            >
              <span aria-hidden className="absolute -top-3 -left-1 font-heading text-6xl text-gold/15">
                &ldquo;
              </span>
              <blockquote className="relative text-sm text-foreground">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="mt-auto text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{t.author}</span> — {t.role}
              </figcaption>
            </RevealItem>
          ))}
        </RevealGroup>

        <p className="mt-8 text-xs text-muted-foreground">
          Example quotes shown for layout purposes — not real customer feedback yet.
        </p>
      </div>
    </section>
  );
}
