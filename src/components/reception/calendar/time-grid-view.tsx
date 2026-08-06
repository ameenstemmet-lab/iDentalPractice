import Link from "next/link";

import { cn } from "@/lib/utils";
import { addDaysToISODate, getDayOfWeek } from "@/features/scheduling/utils/time-math";
import type { AppointmentListItem } from "@/features/reception/appointments/types";

const START_HOUR = 7;
const END_HOUR = 19;
const HOUR_HEIGHT_PX = 56;
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

export function TimeGridView({
  fromDate,
  days,
  appointments,
}: {
  fromDate: string;
  days: number; // 1 for day view, 7 for week view
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
          <div key={date} className="border-b border-l border-border px-2 py-2 text-center">
            <p className="text-xs text-muted-foreground">{WEEKDAY_SHORT[getDayOfWeek(date)]}</p>
            <p className="text-sm font-medium text-foreground">{date.slice(8, 10)}</p>
          </div>
        ))}

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

        {dates.map((date) => (
          <div
            key={date}
            className="relative border-l border-border"
            style={{ height: hours.length * HOUR_HEIGHT_PX }}
          >
            {hours.map((_, i) => (
              <div
                key={i}
                className="absolute right-0 left-0 border-t border-border/60"
                style={{ top: i * HOUR_HEIGHT_PX }}
              />
            ))}

            {byDate.get(date)?.map((appt) => (
              <Link
                key={appt.id}
                href={`/appointments?highlight=${appt.id}`}
                className={cn(
                  "absolute right-1 left-1 overflow-hidden rounded-md border-l-2 px-1.5 py-1 text-[11px] leading-tight shadow-xs transition-shadow hover:shadow-md"
                )}
                style={{
                  top: topOffset(appt.startTime),
                  height: blockHeight(appt.startTime, appt.endTime),
                  backgroundColor: `${appt.dentistColour}1a`,
                  borderColor: appt.dentistColour,
                }}
                title={`${appt.patientName} — ${appt.treatmentName}`}
              >
                <p className="truncate font-medium text-foreground">{appt.startTime} {appt.patientName}</p>
                <p className="truncate text-muted-foreground">{appt.treatmentName}</p>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
