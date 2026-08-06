import Link from "next/link";

import { cn } from "@/lib/utils";
import { addDaysToISODate, getDayOfWeek } from "@/features/scheduling/utils/time-math";
import type { AppointmentListItem } from "@/features/reception/appointments/types";

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** First day (Sunday) of the calendar grid containing `monthStartDate`. */
function gridStart(monthStartDate: string): string {
  const dow = getDayOfWeek(monthStartDate);
  return addDaysToISODate(monthStartDate, -dow);
}

export function MonthView({
  monthStartDate,
  today,
  appointments,
}: {
  monthStartDate: string; // yyyy-mm-01
  today: string;
  appointments: AppointmentListItem[];
}) {
  const currentMonth = monthStartDate.slice(0, 7);
  const start = gridStart(monthStartDate);
  const days = Array.from({ length: 42 }, (_, i) => addDaysToISODate(start, i));

  const byDate = new Map<string, AppointmentListItem[]>();
  for (const appt of appointments) {
    const list = byDate.get(appt.appointmentDate) ?? [];
    list.push(appt);
    byDate.set(appt.appointmentDate, list);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-muted/40">
        {WEEKDAY_SHORT.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((date) => {
          const dayAppointments = byDate.get(date) ?? [];
          const inMonth = date.slice(0, 7) === currentMonth;
          const isToday = date === today;
          return (
            <Link
              key={date}
              href={`/appointments?date=${date}`}
              className={cn(
                "flex min-h-24 flex-col gap-1 border-t border-l border-border p-1.5 transition-colors hover:bg-muted/40",
                !inMonth && "bg-muted/20 text-muted-foreground/50"
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-xs",
                  isToday && "bg-primary font-medium text-primary-foreground"
                )}
              >
                {Number(date.slice(8, 10))}
              </span>
              <div className="flex flex-col gap-0.5">
                {dayAppointments.slice(0, 3).map((appt) => (
                  <span
                    key={appt.id}
                    className="truncate rounded px-1 py-0.5 text-[10px] leading-tight"
                    style={{ backgroundColor: `${appt.dentistColour}22`, color: appt.dentistColour }}
                  >
                    {appt.startTime} {appt.patientName}
                  </span>
                ))}
                {dayAppointments.length > 3 ? (
                  <span className="text-[10px] text-muted-foreground">+{dayAppointments.length - 3} more</span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
