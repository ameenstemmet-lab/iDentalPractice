import Link from "next/link";
import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";

const CONTACT = {
  phone: "021 123 4567",
  address: "123 Healthcare Way, Claremont, Cape Town",
  hours: "Mon – Fri: 8am – 5pm · Sat: 8am – 1pm",
  email: "reception@ipractice.co.za",
} as const;

const FOOTER_LINKS = {
  Practice: [
    { label: "About", href: "#about" },
    { label: "Our Doctors", href: "#doctors" },
    { label: "Our Services", href: "#services" },
    { label: "Contact", href: "#contact" },
  ],
  Patients: [
    { label: "Patient Info", href: "#patient-info" },
    { label: "Book Appointment", href: "/booking" },
    { label: "Medical Aid", href: "#patient-info" },
    { label: "FAQs", href: "#patient-info" },
  ],
} as const;

export function ContactSection() {
  return (
    <section id="contact" className="border-t border-border py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {[
          { icon: PhoneIcon, label: "Call us today", value: CONTACT.phone },
          { icon: MapPinIcon, label: "Visit us", value: CONTACT.address },
          { icon: ClockIcon, label: "Practice hours", value: CONTACT.hours },
          { icon: MailIcon, label: "Email us", value: CONTACT.email },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-4" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-medium text-foreground">{value}</p>
            </div>
          </div>
        ))}
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
              Multi-disciplinary healthcare, delivered by experienced specialists under one roof.
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
