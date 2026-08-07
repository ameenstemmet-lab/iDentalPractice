"use client";

import * as React from "react";
import { SearchIcon } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppointmentTable } from "@/components/reception/appointment-table";
import { usePracticeContext } from "@/components/reception/practice-context";
import { useAppointments, useUpdateAppointmentStatus } from "@/features/reception/appointments/queries";
import { usePractitioners } from "@/features/reception/practitioners/queries";
import type { AppointmentStatus } from "@/features/reception/appointments/types";

const STATUS_OPTIONS: Array<{ value: AppointmentStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "booked", label: "Booked" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No show" },
];

export default function AppointmentsPage() {
  const { practiceId, role } = usePracticeContext();
  const isStaff = role === "staff";
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<AppointmentStatus | "all">("all");
  const [practitionerId, setPractitionerId] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<"date_asc" | "date_desc">("date_asc");

  const practitioners = usePractitioners(practiceId ?? "");
  const appointments = useAppointments({
    practiceId: practiceId ?? "",
    search: search || undefined,
    status,
    practitionerId,
    sortBy,
    pageSize: 50,
  });
  const updateStatus = useUpdateAppointmentStatus();

  function handleStatusChange(appointmentId: string, next: AppointmentStatus) {
    updateStatus.mutate(
      { appointmentId, status: next },
      {
        onSuccess: () => toast.success("Appointment updated."),
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update appointment."),
      }
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Appointments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {appointments.data?.total ?? 0} appointment{appointments.data?.total === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient name or phone…"
            className="pl-8"
          />
        </div>

        <Select value={status} onValueChange={(v) => setStatus(v as AppointmentStatus | "all")}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isStaff ? (
          <Select value={practitionerId} onValueChange={setPractitionerId}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All practitioners" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All practitioners</SelectItem>
              {practitioners.data?.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.firstName} {d.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as "date_asc" | "date_desc")}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_asc">Soonest first</SelectItem>
            <SelectItem value="date_desc">Latest first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AppointmentTable
        appointments={appointments.data?.appointments ?? []}
        isLoading={appointments.isLoading}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
