import { redirect } from "next/navigation";
import { CheckCircle2Icon, XCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ConnectionStatusCard } from "@/features/integrations/google-calendar/components/connection-status-card";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentSession } from "@/lib/auth/session";

export const metadata = { title: "Google Calendar — iPractice" };

interface PracticeWithPractitioners {
  practiceId: string;
  practitioners: { id: string; name: string }[];
}

async function getPracticeData(practiceId: string): Promise<PracticeWithPractitioners> {
  const supabase = createSupabaseAdminClient();

  const { data: practitioners } = await supabase
    .from("practitioners")
    .select("id, first_name, last_name, profession")
    .eq("practice_id", practiceId)
    .eq("active", true)
    .order("first_name")
    .returns<{ id: string; first_name: string; last_name: string; profession: string }[]>();

  return {
    practiceId,
    practitioners: (practitioners ?? []).map((p) => ({
      id: p.id,
      name: `${p.first_name} ${p.last_name} — ${p.profession}`,
    })),
  };
}

export default async function GoogleCalendarSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ gcal_connected?: string; gcal_error?: string }>;
}) {
  const params = await searchParams;
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  const practiceData = await getPracticeData(session.practiceId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Google Calendar</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Connect a Google account so appointments sync automatically. Supabase stays the source of truth
        — Google Calendar is a synchronized view of it, never the other way around. Each practitioner can
        connect their own personal calendar independently of the shared practice-wide one below.
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

      <div className="mt-6 flex flex-col gap-6">
        <ConnectionStatusCard practiceId={practiceData.practiceId} title="Practice-wide calendar" />

        {practiceData.practitioners.map((p) => (
          <ConnectionStatusCard
            key={p.id}
            practiceId={practiceData.practiceId}
            practitionerId={p.id}
            title={p.name}
          />
        ))}
      </div>
    </div>
  );
}
