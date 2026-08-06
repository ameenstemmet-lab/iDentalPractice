"use client";

import * as React from "react";
import { PlusIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { usePracticeContext } from "@/components/reception/practice-context";
import { usePractitioners } from "@/features/reception/practitioners/queries";
import {
  useAddBreak,
  useDeleteBreak,
  usePractitionerBreaks,
  useSaveWorkingDay,
  useWorkingHours,
} from "@/features/reception/working-hours/queries";
import { WEEKDAY_LABELS } from "@/features/reception/working-hours/types";

function WorkingDayRow({
  practitionerId,
  practiceId,
  dayOfWeek,
  isWorking,
  startTime,
  endTime,
}: {
  practitionerId: string;
  practiceId: string;
  dayOfWeek: number;
  isWorking: boolean;
  startTime: string | null;
  endTime: string | null;
}) {
  const save = useSaveWorkingDay();
  const [start, setStart] = React.useState(startTime ?? "08:00");
  const [end, setEnd] = React.useState(endTime ?? "17:00");

  function persist(next: { isWorking: boolean; startTime: string | null; endTime: string | null }) {
    save.mutate(
      { practitionerId, practiceId, dayOfWeek, ...next },
      { onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to save.") }
    );
  }

  return (
    <div className="grid grid-cols-[7rem_auto_1fr_auto_1fr] items-center gap-3 py-2.5">
      <span className="text-sm font-medium text-foreground">{WEEKDAY_LABELS[dayOfWeek]}</span>
      <Switch
        checked={isWorking}
        onCheckedChange={(checked) => persist({ isWorking: checked, startTime: checked ? start : null, endTime: checked ? end : null })}
      />
      {isWorking ? (
        <>
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            onBlur={() => persist({ isWorking: true, startTime: start, endTime: end })}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          />
          <span className="text-center text-xs text-muted-foreground">to</span>
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            onBlur={() => persist({ isWorking: true, startTime: start, endTime: end })}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          />
        </>
      ) : (
        <span className="col-span-3 text-sm text-muted-foreground">Not working</span>
      )}
    </div>
  );
}

function BreaksEditor({ practitionerId, practiceId }: { practitionerId: string; practiceId: string }) {
  const breaks = usePractitionerBreaks(practitionerId);
  const addBreak = useAddBreak();
  const deleteBreak = useDeleteBreak(practitionerId);
  const [dayOfWeek, setDayOfWeek] = React.useState("1");
  const [start, setStart] = React.useState("12:00");
  const [end, setEnd] = React.useState("13:00");

  return (
    <div className="flex flex-col gap-3">
      {breaks.data?.map((b) => (
        <div key={b.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
          <span>
            {WEEKDAY_LABELS[b.dayOfWeek]}, {b.startTime}–{b.endTime}
            {b.description ? ` (${b.description})` : ""}
          </span>
          <Button variant="ghost" size="icon-sm" aria-label="Remove break" onClick={() => deleteBreak.mutate(b.id)}>
            <TrashIcon className="size-3.5" />
          </Button>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WEEKDAY_LABELS.map((label, i) => (
              <SelectItem key={label} value={String(i)}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          type="time"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
        />
        <input
          type="time"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
        />
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() =>
            addBreak.mutate(
              { practitionerId, practiceId, dayOfWeek: Number(dayOfWeek), startTime: start, endTime: end, description: "Lunch" },
              { onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to add break.") }
            )
          }
        >
          <PlusIcon className="size-3.5" />
          Add break
        </Button>
      </div>
    </div>
  );
}

export default function WorkingHoursPage() {
  const { practiceId } = usePracticeContext();
  const practitioners = usePractitioners(practiceId ?? "");
  const [practitionerId, setPractitionerId] = React.useState<string>("");

  React.useEffect(() => {
    if (!practitionerId && practitioners.data?.length) setPractitionerId(practitioners.data[0].id);
  }, [practitionerId, practitioners.data]);

  const workingHours = useWorkingHours(practitionerId || undefined);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Working Hours</h1>
        <p className="mt-1 text-sm text-muted-foreground">Set each practitioner&apos;s weekly schedule and breaks.</p>
      </div>

      <Select value={practitionerId} onValueChange={setPractitionerId}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Choose a practitioner" />
        </SelectTrigger>
        <SelectContent>
          {practitioners.data?.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.firstName} {d.lastName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!practitionerId ? null : workingHours.isLoading ? (
        <Skeleton className="h-64 w-full max-w-xl" />
      ) : (
        <div className="max-w-xl">
          <div className="divide-y divide-border rounded-lg border border-border px-4">
            {workingHours.data?.map((day) => (
              <WorkingDayRow key={day.dayOfWeek} practitionerId={practitionerId} practiceId={practiceId ?? ""} {...day} />
            ))}
          </div>

          <h2 className="mt-6 mb-3 text-sm font-medium text-foreground">Breaks</h2>
          <BreaksEditor practitionerId={practitionerId} practiceId={practiceId ?? ""} />
        </div>
      )}
    </div>
  );
}
