import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Hero } from "@/components/marketing/hero";
import { PainPoints } from "@/components/marketing/pain-points";
import { SpecialitiesGrid } from "@/components/marketing/specialities-grid";
import { WhyChoose } from "@/components/marketing/why-choose";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { FeaturedDoctors } from "@/components/marketing/featured-doctors";
import { Testimonials } from "@/components/marketing/testimonials";
import { FaqSection } from "@/components/marketing/faq-section";
import { FinalCta } from "@/components/marketing/final-cta";
import { ContactSection, MarketingFooter } from "@/components/marketing/marketing-footer";
import { FloatingActions } from "@/components/marketing/floating-actions";
import { getFeaturedBookingPractice } from "@/features/booking/actions/practice";
import { getPractitionersAction } from "@/features/booking/actions/catalog-actions";

// Practitioner data changes as the practice adds/archives staff — never statically cached.
export const dynamic = "force-dynamic";

export default async function Home() {
  const practice = await getFeaturedBookingPractice();
  const practitioners = practice ? await getPractitionersAction(practice.id) : [];

  return (
    <div className="flex min-h-dvh flex-col bg-background pb-16 sm:pb-0">
      <MarketingNav />
      <main className="flex-1">
        <Hero />
        <PainPoints />
        <SpecialitiesGrid />
        <WhyChoose />
        <HowItWorks />
        <FeaturedDoctors practitioners={practitioners} />
        <Testimonials />
        <FaqSection />
        <FinalCta />
        <ContactSection />
      </main>
      <MarketingFooter />
      <FloatingActions />
    </div>
  );
}
