import Link from "next/link";
import { MailIcon, MessageCircleIcon } from "lucide-react";

const CONTACT = {
  email: "hello@ipractice.co.za",
  whatsapp: "+27 21 123 4567",
} as const;

const FOOTER_LINKS = {
  Product: [
    { label: "How it works", href: "#how-it-works" },
    { label: "Specialties supported", href: "#services" },
    { label: "Why iPractice", href: "#about" },
    { label: "FAQ", href: "#faq" },
  ],
  "Get started": [
    { label: "Start your practice", href: "/signup" },
    { label: "Sign in", href: "/login" },
    { label: "Live example", href: "/book/stemmet-dental" },
    { label: "Talk to us", href: "https://wa.me/27211234567" },
  ],
} as const;

export function ContactSection() {
  return (
    <section id="contact" className="border-t border-border py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div>
            <p className="font-heading text-lg font-semibold text-foreground">Questions before you sign up?</p>
            <p className="mt-1 text-sm text-muted-foreground">We answer these ourselves — no sales queue.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={`mailto:${CONTACT.email}`}
              className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors duration-fast hover:border-primary/40"
            >
              <MailIcon className="size-4 text-primary" />
              {CONTACT.email}
            </a>
            <a
              href="https://wa.me/27211234567"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors duration-fast hover:border-primary/40"
            >
              <MessageCircleIcon className="size-4 text-primary" />
              {CONTACT.whatsapp}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2">
            <Link href="#home" className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-heading text-sm font-semibold text-primary-foreground">
                iP
              </span>
              <span className="font-heading text-base font-semibold tracking-tight text-foreground">
                iPractice
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              One diary per practitioner, any specialty, patients book themselves — for
              multi-disciplinary practices that are tired of losing bookings to a calendar that
              can&apos;t keep up.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <p className="text-sm font-semibold text-foreground">{heading}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors duration-fast hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} iPractice. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="#" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
