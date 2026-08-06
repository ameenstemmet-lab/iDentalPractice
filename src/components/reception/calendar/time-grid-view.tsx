import Link from "next/link";

import { cn } from "@/lib/utils";
import { addDaysToISODate, getDayOfWeek } from "@/features/scheduling/utils/time-math";
import type { AppointmentListItem } from "@/features/reception/appointments/types";

const START_HOUR = 7;
const END_HOUR = 19;
const HOUR_HEIGHT_PX = 56;
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface PractitionerColumnMeta {
  id: string;
  firstName: string;
  lastName: string;
  colourCode: string;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function topOffset(startTime: string): number {
  const minutesFromGridStart = timeToMinutes(startTime) - START_HOUR * 60;
  return (minutesFromGridStart / 60) * HOUR_HEIGHT_PX;
}

function blockHeight(startTime: string, endTime: string): number {
  return Math.max(20, ((timeToMinutes(endTime) - timeToMinutes(startTime)) / 60) * HOUR_HEIGHT_PX);
}

function AppointmentBlock({ appt }: { appt: AppointmentListItem }) {
  return (
    <Link
      href={`/appointments?highlight=${appt.id}`}
      className="absolute right-1 left-1 overflow-hidden rounded-md border-l-2 px-1.5 py-1 text-[11px] leading-tight shadow-xs transition-shadow hover:shadow-md"
      style={{
        top: topOffset(appt.startTime),
        height: blockHeight(appt.startTime, appt.endTime),
        backgroundColor: `${appt.practitionerColour}1a`,
        borderColor: appt.practitionerColour,
      }}
      title={`${appt.patientName} — ${appt.treatmentName}`}
    >
      <p className="truncate font-medium text-foreground">
        {appt.startTime} {appt.patientName}
      </p>
      <p className="truncate text-muted-foreground">{appt.treatmentName}</p>
    </Link>
  );
}

function HourGutter({ hours }: { hours: number[] }) {
  return (
    <div className="relative" style={{ height: hours.length * HOUR_HEIGHT_PX }}>
      {hours.map((hour, i) => (
        <div
          key={hour}
          className="absolute right-1 text-right text-[11px] text-muted-foreground"
          style={{ top: i * HOUR_HEIGHT_PX - 6 }}
        >
          {String(hour).padStart(2, "0")}:00
        </div>
      ))}
    </div>
  );
}

function HourLines({ hours }: { hours: number[] }) {
  return (
    <>
      {hours.map((_, i) => (
        <div
          key={i}
          className="absolute right-0 left-0 border-t border-border/60"
          style={{ top: i * HOUR_HEIGHT_PX }}
        />
      ))}
    </>
  );
}

/**
 * Single-day view grouped one column per practitioner (rather than the
 * usual one column per date) — lets reception see every practitioner's own
 * diary side by side at a glance, instead of a single grid with everyone's
 * appointments colour-coded together.
 */
function PractitionerColumnsView({
  practitioners,
  appointments,
}: {
  practitioners: PractitionerColumnMeta[];
  appointments: AppointmentListItem[];
}) {
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const byPractitioner = new Map<string, AppointmentListItem[]>();
  for (const p of practitioners) byPractitioner.set(p.id, []);
  for (const appt of appointments) byPractitioner.get(appt.practitionerId)?.push(appt);

  if (practitioners.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No active practitioners to show a diary for.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <div
        className="grid"
        style={{ gridTemplateColumns: `4rem repeat(${practitioners.length}, minmax(11rem, 1fr))` }}
      >
        <div className="border-b border-border" />
        {practitioners.map((p) => (
          <div key={p.id} className="border-b border-l border-border px-2 py-2 text-center">
            <p className="flex items-center justify-center gap-1.5 truncate text-sm font-medium text-foreground">
              <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: p.colourCode }} />
              {p.firstName} {p.lastName}
            </p>
          </div>
        ))}

        <HourGutter hours={hours} />

        {practitioners.map((p) => (
          <div key={p.id} className="relative border-l border-border" style={{ height: hours.length * HOUR_HEIGHT_PX }}>
            <HourLines hours={hours} />
            {byPractitioner.get(p.id)?.map((appt) => (
              <AppointmentBlock key={appt.id} appt={appt} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function DateColumnsView({
  fromDate,
  days,
  appointments,
}: {
  fromDate: string;
  days: number;
  appointments: AppointmentListItem[];
}) {
  const dates = Array.from({ length: days }, (_, i) => addDaysToISODate(fromDate, i));
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const byDate = new Map<string, AppointmentListItem[]>();
  for (const date of dates) byDate.set(date, []);
  for (const appt of appointments) byDate.get(appt.appointmentDate)?.push(appt);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <div className="grid" style={{ gridTemplateColumns: `4rem repeat(${days}, minmax(9rem, 1fr))` }}>
        <div className="border-b border-border" />
        {dates.map((date) => (
          <div key={date} className={cn("border-b border-l border-border px-2 py-2 text-center")}>
            <p className="text-xs text-muted-foreground">{WEEKDAY_SHORT[getDayOfWeek(date)]}</p>
            <p className="text-sm font-medium text-foreground">{date.slice(8, 10)}</p>
          </div>
        ))}

        <HourGutter hours={hours} />

        {dates.map((date) => (
          <div key={date} className="relative border-l border-border" style={{ height: hours.length * HOUR_HEIGHT_PX }}>
            <HourLines hours={hours} />
            {byDate.get(date)?.map((appt) => (
              <AppointmentBlock key={appt.id} appt={appt} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimeGridView({
  fromDate,
  days,
  appointments,
  practitioners,
}: {
  fromDate: string;
  days: number; // 1 for day view, 7 for week view
  appointments: AppointmentListItem[];
  /** When set and `days === 1`, renders one column per practitioner instead of the single day column. */
  practitioners?: PractitionerColumnMeta[];
}) {
  if (days === 1 && practitioners) {
    return <PractitionerColumnsView practitioners={practitioners} appointments={appointments} />;
  }
  return <DateColumnsView fromDate={fromDate} days={days} appointments={appointments} />;
}
