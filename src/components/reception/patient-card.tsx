import Link from "next/link";
import { CalendarIcon, MailIcon, PhoneIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDateLong } from "@/features/booking/utils/format";
import type { PatientListItem } from "@/features/reception/patients/types";

function initials(first: string, last: string): string {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

export function PatientCard({ patient }: { patient: PatientListItem }) {
  return (
    <Link
      href={`/patients/${patient.id}`}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-base hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <Avatar className="size-10">
          <AvatarFallback>{initials(patient.firstName, patient.lastName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {patient.firstName} {patient.lastName}
          </p>
          {patient.cellphone ? (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <PhoneIcon className="size-3" />
              {patient.cellphone}
            </p>
          ) : null}
        </div>
      </div>

      {patient.email ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MailIcon className="size-3" />
          <span className="truncate">{patient.email}</span>
        </p>
      ) : null}

      <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span>{patient.lastVisit ? `Last visit ${formatDateLong(patient.lastVisit)}` : "No visits yet"}</span>
      </div>
      {patient.nextAppointment ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <CalendarIcon className="size-3" />
          Next: {formatDateLong(patient.nextAppointment)}
        </p>
      ) : null}
    </Link>
  );
}
