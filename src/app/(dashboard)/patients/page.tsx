"use client";

import * as React from "react";
import { SearchIcon, UserPlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { UsersIcon } from "lucide-react";
import { SkeletonCard } from "@/components/shared/skeleton-patterns";
import { PatientCard } from "@/components/reception/patient-card";
import { usePracticeContext } from "@/components/reception/practice-context";
import { usePatients } from "@/features/reception/patients/queries";

const PAGE_SIZE = 20;

export default function PatientsPage() {
  const { practiceId } = usePracticeContext();
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);

  const { data, isLoading } = usePatients({
    practiceId: practiceId ?? "",
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Patients</h1>
          <p className="mt-1 text-sm text-muted-foreground">{data?.total ?? 0} patients</p>
        </div>
        <Button className="gap-1.5">
          <UserPlusIcon className="size-4" />
          Add patient
        </Button>
      </div>

      <div className="relative max-w-xs">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search patients…"
          className="pl-8"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : data?.patients.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <UsersIcon />
          </EmptyMedia>
          <EmptyTitle>No patients found</EmptyTitle>
          <EmptyDescription>Try a different search, or add a new patient.</EmptyDescription>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.patients.map((patient) => <PatientCard key={patient.id} patient={patient} />)}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
