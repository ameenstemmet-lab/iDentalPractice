"use client";

import Link from "next/link";
import {
  CalendarDaysIcon,
  CheckIcon,
  MoreHorizontalIcon,
  PrinterIcon,
  UserXIcon,
  XIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppointmentStatusBadge } from "./appointment-status-badge";
import { SkeletonTable } from "@/components/shared/skeleton-patterns";
import { formatCurrency, formatDateLong } from "@/features/booking/utils/format";
import type { AppointmentListItem, AppointmentStatus } from "@/features/reception/appointments/types";

export interface AppointmentTableProps {
  appointments: AppointmentListItem[];
  isLoading?: boolean;
  onStatusChange: (appointmentId: string, status: AppointmentStatus) => void;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AppointmentTable({ appointments, isLoading, onStatusChange }: AppointmentTableProps) {
  if (isLoading) return <SkeletonTable rows={8} columns={6} />;

  if (appointments.length === 0) {
    return (
      <Empty>
        <EmptyMedia variant="icon">
          <CalendarDaysIcon />
        </EmptyMedia>
        <EmptyTitle>No appointments found</EmptyTitle>
        <EmptyDescription>Try adjusting your filters or search.</EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Practitioner</TableHead>
            <TableHead>Treatment</TableHead>
            <TableHead>Date &amp; time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((appointment) => (
            <TableRow key={appointment.id}>
              <TableCell>
                <Link
                  href={`/patients/${appointment.patientId}`}
                  className="flex items-center gap-2.5 hover:underline"
                >
                  <Avatar className="size-6">
                    <AvatarFallback className="text-[10px]">{initials(appointment.patientName)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground">{appointment.patientName}</span>
                </Link>
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span
                    aria-hidden
                    className="size-2 rounded-full"
                    style={{ backgroundColor: appointment.practitionerColour }}
                  />
                  {appointment.practitionerName}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">{appointment.treatmentName}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDateLong(appointment.appointmentDate)} · {appointment.startTime}
              </TableCell>
              <TableCell>
                <AppointmentStatusBadge status={appointment.status} />
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatCurrency(appointment.treatmentPrice)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Appointment actions">
                      <MoreHorizontalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onStatusChange(appointment.id, "confirmed")}>
                      <CheckIcon />
                      Confirm
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(appointment.id, "completed")}>
                      <CheckIcon />
                      Mark complete
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(appointment.id, "no_show")}>
                      <UserXIcon />
                      Mark no show
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.print()}>
                      <PrinterIcon />
                      Print
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onStatusChange(appointment.id, "cancelled")}
                    >
                      <XIcon />
                      Cancel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
