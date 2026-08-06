"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { fromZonedTime } from "date-fns-tz";
import { CalendarOffIcon, PlusIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePracticeContext } from "@/components/reception/practice-context";
import { usePractitioners } from "@/features/reception/practitioners/queries";
import { useBlockedPeriods, useCreateBlockedPeriod, useDeleteBlockedPeriod } from "@/features/reception/blocked-time/queries";
import { BLOCKED_TIME_REASONS } from "@/features/reception/blocked-time/types";

const blockedPeriodSchema = z
  .object({
    practitionerId: z.string().min(1, "Choose a practitioner"),
    date: z.string().min(1, "Required"),
    startTime: z.string().min(1, "Required"),
    endTime: z.string().min(1, "Required"),
    reason: z.string().optional(),
  })
  .refine((v) => v.endTime > v.startTime, { message: "End must be after start", path: ["endTime"] });

type BlockedPeriodFormValues = z.infer<typeof blockedPeriodSchema>;

export default function BlockedTimePage() {
  const { practiceId, timezone } = usePracticeContext();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const practitioners = usePractitioners(practiceId ?? "");
  const blockedPeriods = useBlockedPeriods(practiceId ?? "");
  const createBlockedPeriod = useCreateBlockedPeriod(practiceId ?? "");
  const deleteBlockedPeriod = useDeleteBlockedPeriod(practiceId ?? "");

  const form = useForm<BlockedPeriodFormValues>({
    resolver: zodResolver(blockedPeriodSchema),
    defaultValues: { practitionerId: "", date: "", startTime: "09:00", endTime: "17:00", reason: BLOCKED_TIME_REASONS[0] },
  });

  function handleSubmit(values: BlockedPeriodFormValues) {
    // The date/time inputs are practice-local wall-clock values with no
    // timezone attached. fromZonedTime interprets them as being in
    // `timezone` and returns the correct absolute instant — a plain
    // `new Date(...)` here would be silently wrong in any timezone other
    // than the server's (the exact bug already hit and fixed elsewhere in
    // this codebase).
    createBlockedPeriod.mutate(
      {
        practitionerId: values.practitionerId,
        startsAt: fromZonedTime(`${values.date}T${values.startTime}:00`, timezone).toISOString(),
        endsAt: fromZonedTime(`${values.date}T${values.endTime}:00`, timezone).toISOString(),
        reason: values.reason,
      },
      {
        onSuccess: () => {
          toast.success("Time blocked.");
          setDialogOpen(false);
          form.reset();
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to block time."),
      }
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Blocked Time</h1>
          <p className="mt-1 text-sm text-muted-foreground">Leave, training, meetings, holidays, maintenance.</p>
        </div>
        <Button className="gap-1.5" onClick={() => setDialogOpen(true)}>
          <PlusIcon className="size-4" />
          Block time
        </Button>
      </div>

      {blockedPeriods.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : blockedPeriods.data?.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <CalendarOffIcon />
          </EmptyMedia>
          <EmptyTitle>No blocked time</EmptyTitle>
          <EmptyDescription>Block leave, training, or maintenance windows here.</EmptyDescription>
        </Empty>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {blockedPeriods.data?.map((period) => (
            <div key={period.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {period.reason ?? "Blocked"} — {period.practitionerName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(period.startsAt).toLocaleString()} → {new Date(period.endsAt).toLocaleString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Remove"
                onClick={() => deleteBlockedPeriod.mutate(period.id)}
              >
                <TrashIcon className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block time</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
            <FieldGroup>
              <Field data-invalid={!!form.formState.errors.practitionerId}>
                <FieldLabel>Practitioner</FieldLabel>
                <Select onValueChange={(v) => form.setValue("practitionerId", v, { shouldValidate: true })}>
                  <SelectTrigger>
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
                <FieldError errors={[form.formState.errors.practitionerId]} />
              </Field>
              <Field data-invalid={!!form.formState.errors.reason}>
                <FieldLabel>Reason</FieldLabel>
                <Select
                  defaultValue={BLOCKED_TIME_REASONS[0]}
                  onValueChange={(v) => form.setValue("reason", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOCKED_TIME_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field data-invalid={!!form.formState.errors.date}>
                <FieldLabel htmlFor="date">Date</FieldLabel>
                <input
                  id="date"
                  type="date"
                  {...form.register("date")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                />
                <FieldError errors={[form.formState.errors.date]} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field data-invalid={!!form.formState.errors.startTime}>
                  <FieldLabel htmlFor="startTime">Start</FieldLabel>
                  <input
                    id="startTime"
                    type="time"
                    {...form.register("startTime")}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  />
                </Field>
                <Field data-invalid={!!form.formState.errors.endTime}>
                  <FieldLabel htmlFor="endTime">End</FieldLabel>
                  <input
                    id="endTime"
                    type="time"
                    {...form.register("endTime")}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  />
                  <FieldError errors={[form.formState.errors.endTime]} />
                </Field>
              </div>
            </FieldGroup>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createBlockedPeriod.isPending}>
                {createBlockedPeriod.isPending ? "Saving…" : "Block time"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
