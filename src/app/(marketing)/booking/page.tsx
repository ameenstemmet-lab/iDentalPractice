import { redirect } from "next/navigation";

import { getFeaturedBookingPractice } from "@/features/booking/actions/practice";

// Legacy URL from before multi-tenancy — there's no longer a single
// canonical practice to serve here, so this keeps old bookmarks/links
// working by forwarding to the current featured practice's slug URL.
export const dynamic = "force-dynamic";

export default async function LegacyBookingRedirectPage() {
  const practice = await getFeaturedBookingPractice();
  redirect(practice ? `/book/${practice.slug}` : "/");
}
