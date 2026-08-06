import Link from "next/link";
import { CalendarPlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ConnectCalendarButton({ connectUrl }: { connectUrl: string }) {
  return (
    <Button asChild className="gap-1.5">
      <Link href={connectUrl}>
        <CalendarPlusIcon className="size-4" />
        Connect Google Calendar
      </Link>
    </Button>
  );
}
