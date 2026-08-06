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
import type { Practitioner } from "@/features/reception/practitioners/types";

export function PractitionerCard({
  practitioner,
  onEdit,
  onToggleArchived,
}: {
  practitioner: Practitioner;
  onEdit: () => void;
  onToggleArchived: () => void;
}) {
  const initials = `${practitioner.firstName[0]}${practitioner.lastName[0]}`.toUpperCase();

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <Avatar className="size-10" style={{ backgroundColor: `${practitioner.colourCode}22` }}>
            <AvatarFallback style={{ color: practitioner.colourCode }}>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {practitioner.title ? `${practitioner.title} ` : ""}
              {practitioner.firstName} {practitioner.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{practitioner.email ?? practitioner.cellphone ?? "No contact info"}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Practitioner actions">
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/working-hours">
                <ClockIcon />
                Working hours
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onToggleArchived}>
              {practitioner.active ? <ArchiveIcon /> : <ArchiveRestoreIcon />}
              {practitioner.active ? "Archive" : "Restore"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-1.5">
        <Badge variant="secondary" className="gap-1">
          <ClockIcon className="size-3" />
          {practitioner.consultationDuration} min
        </Badge>
        {!practitioner.active ? <Badge variant="outline">Archived</Badge> : null}
      </div>
    </div>
  );
}
