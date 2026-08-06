import { createClient } from "@supabase/supabase-js";
import { CheckCircle2Icon, XCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ConnectionStatusCard } from "@/features/integrations/google-calendar/components/connection-status-card";

export const metadata = { title: "Google Calendar — iDentalPractice" };

/**
 * TODO(auth): replace with the signed-in user's practice once a login
 * system exists. Until then this resolves the first practice in the
 * database — correct for a single-practice deployment, not for real
 * multi-tenant use, and deliberately not hidden behind a nicer name.
 */
async function getPlaceholderPracticeId(): Promise<string | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const { data } = await supabase.from("practices").select("id").limit(1).maybeSingle<{ id: string }>();
  return data?.id ?? null;
}

export default async function GoogleCalendarSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ gcal_connected?: string; gcal_error?: string }>;
}) {
  const params = await searchParams;
  const practiceId = await getPlaceholderPracticeId();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Google Calendar</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Connect a Google account so appointments sync automatically. Supabase stays the source of truth
        — Google Calendar is a synchronized view of it, never the other way around.
      </p>

      {params.gcal_connected ? (
        <Alert variant="success" className="mt-6">
          <CheckCircle2Icon />
          <AlertTitle>Connected</AlertTitle>
          <AlertDescription>Your Google Calendar is now connected.</AlertDescription>
        </Alert>
      ) : null}

      {params.gcal_error ? (
        <Alert variant="destructive" className="mt-6">
          <XCircleIcon />
          <AlertTitle>Connection failed</AlertTitle>
          <AlertDescription>{params.gcal_error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-6">
        {practiceId ? (
          <ConnectionStatusCard practiceId={practiceId} />
        ) : (
          <p className="text-sm text-muted-foreground">
            No practice found yet — create one before connecting a calendar.
          </p>
        )}
      </div>
    </div>
  );
}
