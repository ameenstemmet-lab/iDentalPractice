"use client";

import { use } from "react";
import {
  CalendarIcon,
  FileTextIcon,
  MailIcon,
  NotebookIcon,
  PhoneIcon,
  StethoscopeIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentStatusBadge } from "@/components/reception/appointment-status-badge";
import { usePatient, usePatientAppointments } from "@/features/reception/patients/queries";
import { formatDateLong } from "@/features/booking/utils/format";

function initials(first: string, last: string): string {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

export default function PatientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: patient, isLoading } = usePatient(id);
  const { data: appointments, isLoading: appointmentsLoading } = usePatientAppointments(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!patient) {
    return (
      <Empty>
        <EmptyTitle>Patient not found</EmptyTitle>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-14">
          <AvatarFallback className="text-base">{initials(patient.firstName, patient.lastName)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {patient.firstName} {patient.lastName}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {patient.cellphone ? (
              <span className="flex items-center gap-1">
                <PhoneIcon className="size-3.5" />
                {patient.cellphone}
              </span>
            ) : null}
            {patient.email ? (
              <span className="flex items-center gap-1">
                <MailIcon className="size-3.5" />
                {patient.email}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="treatments">Treatment history</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <span className="text-muted-foreground">Date of birth</span>
                <span className="text-foreground">{patient.dateOfBirth ? formatDateLong(patient.dateOfBirth) : "—"}</span>
                <span className="text-muted-foreground">Gender</span>
                <span className="text-foreground capitalize">{patient.gender ?? "—"}</span>
                <span className="text-muted-foreground">Patient since</span>
                <span className="text-foreground">{formatDateLong(patient.createdAt.slice(0, 10))}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="mb-2 text-sm font-medium text-foreground">Notes</p>
                <p className="text-sm text-muted-foreground">{patient.notes || "No notes yet."}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="mt-4">
          {appointmentsLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : !appointments?.length ? (
            <Empty>
              <EmptyMedia variant="icon">
                <CalendarIcon />
              </EmptyMedia>
              <EmptyTitle>No appointments yet</EmptyTitle>
            </Empty>
          ) : (
            <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
              {appointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.treatmentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateLong(a.appointmentDate)} · {a.startTime} · {a.dentistName}
                    </p>
                  </div>
                  <AppointmentStatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="treatments" className="mt-4">
          {!appointments?.filter((a) => a.status === "completed").length ? (
            <Empty>
              <EmptyMedia variant="icon">
                <StethoscopeIcon />
              </EmptyMedia>
              <EmptyTitle>No completed treatments yet</EmptyTitle>
            </Empty>
          ) : (
            <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
              {appointments
                .filter((a) => a.status === "completed")
                .map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-4 py-3">
                    <p className="text-sm text-foreground">{a.treatmentName}</p>
                    <p className="text-xs text-muted-foreground">{formatDateLong(a.appointmentDate)}</p>
                  </div>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Empty>
            <EmptyMedia variant="icon">
              <FileTextIcon />
            </EmptyMedia>
            <EmptyTitle>Documents</EmptyTitle>
            <EmptyDescription>
              <Badge variant="secondary">Placeholder</Badge> — document uploads aren&apos;t built yet.
            </EmptyDescription>
          </Empty>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardContent className="flex items-start gap-2">
              <NotebookIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{patient.notes || "No notes recorded for this patient."}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
