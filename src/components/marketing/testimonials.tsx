import { StarIcon } from "lucide-react";

interface ExampleTestimonial {
  quote: string;
  author: string;
  service: string;
}

// Placeholder copy, not real patient feedback — swap in your actual Google
// reviews (or connect the Google Business Profile API) before launch.
const EXAMPLE_TESTIMONIALS: ExampleTestimonial[] = [
  {
    quote: "Excellent care from a professional and friendly team. I always feel in safe hands here.",
    author: "Example patient",
    service: "General Practice",
  },
  {
    quote: "Being able to see my GP and physio at the same practice made my recovery so much easier to manage.",
    author: "Example patient",
    service: "Physiotherapy",
  },
  {
    quote: "Booking online took two minutes and the reminder emails meant I never missed an appointment.",
    author: "Example patient",
    service: "Dentistry",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-wide text-gold-foreground uppercase">
            What our patients say
          </p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Trusted by families across the community
          </h2>
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon key={i} className="size-4 fill-gold text-gold" />
            ))}
            <span className="ml-1.5 text-sm font-medium text-foreground">5.0</span>
            <span className="text-sm text-muted-foreground">average rating</span>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {EXAMPLE_TESTIMONIALS.map((t) => (
            <figure
              key={t.quote}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-xs"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} className="size-3.5 fill-gold text-gold" />
                ))}
              </div>
              <blockquote className="text-sm text-foreground">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="mt-auto text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{t.author}</span> — {t.service}
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Example reviews shown for layout purposes — connect your Google Business Profile to display real
          patient reviews here.
        </p>
      </div>
    </section>
  );
}
