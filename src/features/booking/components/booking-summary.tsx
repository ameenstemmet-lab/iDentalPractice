import {
  CalendarIcon,
  ClockIcon,
  MailIcon,
  PhoneIcon,
  StethoscopeIcon,
  UserIcon,
} from "lucide-react";

import { Separator } from "@/components/ui/separator";
import type { Practitioner, PatientDetails, Treatment } from "../types";
import { formatCurrency, formatDateLong } from "../utils/format";

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="truncate text-sm font-medium text-foreground">{value}</span>
      </div>
    </div>
  );
}

export function BookingSummary({
  practitioner,
  treatment,
  date,
  time,
  patient,
}: {
  practitioner: Practitioner;
  treatment: Treatment;
  date: string;
  time: string;
  patient?: PatientDetails | null;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="divide-y divide-border">
        <SummaryRow
          icon={UserIcon}
          label="Practitioner"
          value={`${practitioner.title} ${practitioner.firstName} ${practitioner.lastName}`}
        />
        <SummaryRow icon={StethoscopeIcon} label="Treatment" value={treatment.name} />
        <SummaryRow
          icon={CalendarIcon}
          label="Date & time"
          value={`${formatDateLong(date)} at ${time}`}
        />
        <SummaryRow
          icon={ClockIcon}
          label="Duration"
          value={`~${treatment.durationMinutes} min`}
        />
        <SummaryRow
          icon={StethoscopeIcon}
          label="Starting price"
          value={formatCurrency(treatment.startingPrice)}
        />
      </div>

      {patient ? (
        <>
          <Separator className="my-1" />
          <div className="divide-y divide-border">
            <SummaryRow
              icon={UserIcon}
              label="Patient"
              value={`${patient.firstName} ${patient.surname}`}
            />
            <SummaryRow icon={PhoneIcon} label="Mobile" value={patient.mobileNumber} />
            <SummaryRow icon={MailIcon} label="Email" value={patient.email} />
          </div>
        </>
      ) : null}
    </div>
  );
}
