"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ClockIcon, MoreHorizontalIcon, PlusIcon, StethoscopeIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SkeletonCard } from "@/components/shared/skeleton-patterns";
import { usePracticeContext } from "@/components/reception/practice-context";
import { formatCurrency } from "@/features/booking/utils/format";
import {
  useCreateTreatment,
  useSetTreatmentActive,
  useTreatments,
  useUpdateTreatment,
} from "@/features/reception/treatments/queries";
import type { Treatment } from "@/features/reception/treatments/types";

const treatmentSchema = z.object({
  treatmentName: z.string().trim().min(1, "Required"),
  description: z.string().trim().optional(),
  durationMinutes: z.number().int().positive("Must be positive"),
  price: z.number().nonnegative("Must be zero or more"),
  colour: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Use a hex colour like #10B981"),
});

type TreatmentFormValues = z.infer<typeof treatmentSchema>;

function TreatmentFormDialog({
  open,
  onOpenChange,
  treatment,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treatment: Treatment | null;
  onSubmit: (values: TreatmentFormValues) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<TreatmentFormValues>({
    resolver: zodResolver(treatmentSchema),
    values: treatment
      ? {
          treatmentName: treatment.treatmentName,
          description: treatment.description ?? "",
          durationMinutes: treatment.durationMinutes,
          price: treatment.price,
          colour: treatment.colour,
        }
      : { treatmentName: "", description: "", durationMinutes: 30, price: 0, colour: "#10B981" },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{treatment ? "Edit treatment" : "New treatment"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!form.formState.errors.treatmentName}>
              <FieldLabel htmlFor="treatmentName">Name</FieldLabel>
              <Input id="treatmentName" {...form.register("treatmentName")} />
              <FieldError errors={[form.formState.errors.treatmentName]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea id="description" rows={2} {...form.register("description")} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!form.formState.errors.durationMinutes}>
                <FieldLabel htmlFor="durationMinutes">Duration (min)</FieldLabel>
                <Input
                  id="durationMinutes"
                  type="number"
                  {...form.register("durationMinutes", { valueAsNumber: true })}
                />
                <FieldError errors={[form.formState.errors.durationMinutes]} />
              </Field>
              <Field data-invalid={!!form.formState.errors.price}>
                <FieldLabel htmlFor="price">Price (R)</FieldLabel>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...form.register("price", { valueAsNumber: true })}
                />
                <FieldError errors={[form.formState.errors.price]} />
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function TreatmentsPage() {
  const { practiceId } = usePracticeContext();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Treatment | null>(null);

  const treatments = useTreatments(practiceId ?? "", true);
  const createTreatment = useCreateTreatment(practiceId ?? "");
  const updateTreatment = useUpdateTreatment();
  const setActive = useSetTreatmentActive();

  function handleSubmit(values: TreatmentFormValues) {
    const mutation = editing
      ? updateTreatment.mutateAsync({ treatmentId: editing.id, input: values })
      : createTreatment.mutateAsync(values);

    mutation
      .then(() => {
        toast.success(editing ? "Treatment updated." : "Treatment created.");
        setDialogOpen(false);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Something went wrong."));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Treatments</h1>
          <p className="mt-1 text-sm text-muted-foreground">{treatments.data?.length ?? 0} treatments</p>
        </div>
        <Button
          className="gap-1.5"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <PlusIcon className="size-4" />
          New treatment
        </Button>
      </div>

      {treatments.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : treatments.data?.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <StethoscopeIcon />
          </EmptyMedia>
          <EmptyTitle>No treatments yet</EmptyTitle>
          <EmptyDescription>Create your first treatment type.</EmptyDescription>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {treatments.data?.map((treatment) => (
            <div key={treatment.id} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: treatment.colour }} />
                  <p className="text-sm font-semibold text-foreground">{treatment.treatmentName}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Treatment actions">
                      <MoreHorizontalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing(treatment);
                        setDialogOpen(true);
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() =>
                        setActive.mutate(
                          { treatmentId: treatment.id, active: !treatment.active },
                          {
                            onSuccess: () => toast.success(treatment.active ? "Deactivated." : "Activated."),
                          }
                        )
                      }
                    >
                      {treatment.active ? "Deactivate" : "Activate"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {treatment.description ? (
                <p className="text-xs text-muted-foreground">{treatment.description}</p>
              ) : null}
              <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <ClockIcon className="size-3" />
                  {treatment.durationMinutes} min
                </span>
                <span className="font-medium text-foreground">{formatCurrency(treatment.price)}</span>
              </div>
              {!treatment.active ? (
                <Badge variant="outline" className="w-fit">
                  Inactive
                </Badge>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <TreatmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        treatment={editing}
        onSubmit={handleSubmit}
        isSubmitting={createTreatment.isPending || updateTreatment.isPending}
      />
    </div>
  );
}
