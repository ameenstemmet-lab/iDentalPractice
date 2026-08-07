import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Hero } from "@/components/marketing/hero";
import { SpecialitiesGrid } from "@/components/marketing/specialities-grid";
import { WhyChoose } from "@/components/marketing/why-choose";
import { FeaturedDoctors } from "@/components/marketing/featured-doctors";
import { Testimonials } from "@/components/marketing/testimonials";
import { FaqSection } from "@/components/marketing/faq-section";
import { ContactSection, MarketingFooter } from "@/components/marketing/marketing-footer";
import { FloatingActions } from "@/components/marketing/floating-actions";
import { getCurrentBookingPractice } from "@/features/booking/actions/practice";
import { getPractitionersAction } from "@/features/booking/actions/catalog-actions";

// Practitioner data changes as the practice adds/archives staff — never statically cached.
export const dynamic = "force-dynamic";

export default async function Home() {
  const practice = await getCurrentBookingPractice();
  const practitioners = practice ? await getPractitionersAction(practice.id) : [];

  return (
    <div className="flex min-h-dvh flex-col bg-background pb-16 sm:pb-0">
      <MarketingNav />
      <main className="flex-1">
        <Hero />
        <SpecialitiesGrid />
        <WhyChoose />
        <FeaturedDoctors practitioners={practitioners} />
        <Testimonials />
        <FaqSection />
        <ContactSection />
      </main>
      <MarketingFooter />
      <FloatingActions />
    </div>
  );
}
