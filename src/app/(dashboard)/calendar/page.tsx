"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon, MousePointerClickIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentTable } from "@/components/reception/appointment-table";
import { TimeGridView } from "@/components/reception/calendar/time-grid-view";
import { MonthView } from "@/components/reception/calendar/month-view";
import { usePracticeContext } from "@/components/reception/practice-context";
import { useReceptionUiStore } from "@/features/reception/shared/ui-store";
import { useAppointments, useUpdateAppointmentStatus } from "@/features/reception/appointments/queries";
import { usePractitioners } from "@/features/reception/practitioners/queries";
import { addDaysToISODate, getDayOfWeek } from "@/features/scheduling/utils/time-math";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function startOfWeek(date: string): string {
  return addDaysToISODate(date, -getDayOfWeek(date));
}

export default function CalendarPage() {
  const { practiceId } = usePracticeContext();
  const { calendarView, setCalendarView } = useReceptionUiStore();
  const [anchorDate, setAnchorDate] = React.useState(todayISO());
  const practitioners = usePractitioners(practiceId ?? "");
  const updateStatus = useUpdateAppointmentStatus();

  const { fromDate, toDate } =
    calendarView === "day"
      ? { fromDate: anchorDate, toDate: anchorDate }
      : calendarView === "week"
        ? { fromDate: startOfWeek(anchorDate), toDate: addDaysToISODate(startOfWeek(anchorDate), 6) }
        : calendarView === "month"
          ? {
              fromDate: `${anchorDate.slice(0, 7)}-01`,
              toDate: addDaysToISODate(`${anchorDate.slice(0, 7)}-01`, 41),
            }
          : { fromDate: anchorDate, toDate: addDaysToISODate(anchorDate, 30) }; // agenda: next 30 days

  const appointments = useAppointments({
    practiceId: practiceId ?? "",
    fromDate,
    toDate,
    pageSize: 500,
    sortBy: "date_asc",
  });

  function shift(days: number) {
    setAnchorDate((d) => addDaysToISODate(d, days));
  }

  const stepSize = calendarView === "day" ? 1 : calendarView === "week" ? 7 : calendarView === "month" ? 30 : 30;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Colour-coded by practitioner.</p>
        </div>

        <Tabs value={calendarView} onValueChange={(v) => setCalendarView(v as typeof calendarView)}>
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon-sm" aria-label="Previous" onClick={() => shift(-stepSize)}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAnchorDate(todayISO())}>
            Today
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Next" onClick={() => shift(stepSize)}>
            <ChevronRightIcon className="size-4" />
          </Button>
          <span className="ml-2 text-sm font-medium text-foreground">{fromDate}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {practitioners.data?.map((d) => (
            <Badge key={d.id} variant="outline" className="gap-1.5">
              <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: d.colourCode }} />
              {d.firstName} {d.lastName}
            </Badge>
          ))}
        </div>
      </div>

      {calendarView !== "month" && calendarView !== "agenda" ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MousePointerClickIcon className="size-3.5" />
          Drag-and-drop rescheduling is coming soon — click an appointment to manage it from the Appointments page.
        </p>
      ) : null}

      {appointments.isLoading ? (
        <Skeleton className="h-[600px] w-full" />
      ) : calendarView === "day" ? (
        <TimeGridView
          fromDate={fromDate}
          days={1}
          appointments={appointments.data?.appointments ?? []}
          practitioners={practitioners.data}
        />
      ) : calendarView === "week" ? (
        <TimeGridView fromDate={fromDate} days={7} appointments={appointments.data?.appointments ?? []} />
      ) : calendarView === "month" ? (
        <MonthView monthStartDate={fromDate} today={todayISO()} appointments={appointments.data?.appointments ?? []} />
      ) : (
        <AppointmentTable
          appointments={appointments.data?.appointments ?? []}
          onStatusChange={(id, status) =>
            updateStatus.mutate(
              { appointmentId: id, status },
              { onSuccess: () => toast.success("Appointment updated.") }
            )
          }
        />
      )}
    </div>
  );
}
