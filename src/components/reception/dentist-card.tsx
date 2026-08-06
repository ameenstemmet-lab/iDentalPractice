"use client";

import Link from "next/link";
import { ArchiveIcon, ArchiveRestoreIcon, ClockIcon, MoreHorizontalIcon, PencilIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Dentist } from "@/features/reception/dentists/types";

export function DentistCard({
  dentist,
  onEdit,
  onToggleArchived,
}: {
  dentist: Dentist;
  onEdit: () => void;
  onToggleArchived: () => void;
}) {
  const initials = `${dentist.firstName[0]}${dentist.lastName[0]}`.toUpperCase();

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <Avatar className="size-10" style={{ backgroundColor: `${dentist.colourCode}22` }}>
            <AvatarFallback style={{ color: dentist.colourCode }}>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {dentist.title ? `${dentist.title} ` : ""}
              {dentist.firstName} {dentist.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{dentist.email ?? dentist.cellphone ?? "No contact info"}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Dentist actions">
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dentists/${dentist.id}/working-hours`}>
                <ClockIcon />
                Working hours
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onToggleArchived}>
              {dentist.active ? <ArchiveIcon /> : <ArchiveRestoreIcon />}
              {dentist.active ? "Archive" : "Restore"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-1.5">
        <Badge variant="secondary" className="gap-1">
          <ClockIcon className="size-3" />
          {dentist.consultationDuration} min
        </Badge>
        {!dentist.active ? <Badge variant="outline">Archived</Badge> : null}
      </div>
    </div>
  );
}
