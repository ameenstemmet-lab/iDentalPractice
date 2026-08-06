"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { StethoscopeIcon } from "lucide-react";
import { SkeletonCard } from "@/components/shared/skeleton-patterns";
import { DentistCard } from "@/components/reception/dentist-card";
import { usePracticeContext } from "@/components/reception/practice-context";
import { useCreateDentist, useDentists, useSetDentistArchived, useUpdateDentist } from "@/features/reception/dentists/queries";
import type { Dentist } from "@/features/reception/dentists/types";

const dentistSchema = z.object({
  firstName: z.string().trim().min(1, "Required"),
  lastName: z.string().trim().min(1, "Required"),
  title: z.string().trim().optional(),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  cellphone: z.string().trim().optional(),
  colourCode: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Use a hex colour like #2563EB"),
  consultationDuration: z.number().int().positive("Must be positive"),
});

type DentistFormValues = z.infer<typeof dentistSchema>;

const DEFAULT_COLOURS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

function DentistFormDialog({
  open,
  onOpenChange,
  dentist,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dentist: Dentist | null;
  onSubmit: (values: DentistFormValues) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<DentistFormValues>({
    resolver: zodResolver(dentistSchema),
    values: dentist
      ? {
          firstName: dentist.firstName,
          lastName: dentist.lastName,
          title: dentist.title ?? "",
          email: dentist.email ?? "",
          cellphone: dentist.cellphone ?? "",
          colourCode: dentist.colourCode,
          consultationDuration: dentist.consultationDuration,
        }
      : {
          firstName: "",
          lastName: "",
          title: "Dr.",
          email: "",
          cellphone: "",
          colourCode: DEFAULT_COLOURS[0],
          consultationDuration: 30,
        },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dentist ? "Edit dentist" : "Add dentist"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!form.formState.errors.title}>
                <FieldLabel htmlFor="title">Title</FieldLabel>
                <Input id="title" {...form.register("title")} />
              </Field>
              <Field data-invalid={!!form.formState.errors.consultationDuration}>
                <FieldLabel htmlFor="consultationDuration">Consultation (min)</FieldLabel>
                <Input
                  id="consultationDuration"
                  type="number"
                  {...form.register("consultationDuration", { valueAsNumber: true })}
                />
                <FieldError errors={[form.formState.errors.consultationDuration]} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!form.formState.errors.firstName}>
                <FieldLabel htmlFor="firstName">First name</FieldLabel>
                <Input id="firstName" {...form.register("firstName")} />
                <FieldError errors={[form.formState.errors.firstName]} />
              </Field>
              <Field data-invalid={!!form.formState.errors.lastName}>
                <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                <Input id="lastName" {...form.register("lastName")} />
                <FieldError errors={[form.formState.errors.lastName]} />
              </Field>
            </div>
            <Field data-invalid={!!form.formState.errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" {...form.register("email")} />
              <FieldError errors={[form.formState.errors.email]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.cellphone}>
              <FieldLabel htmlFor="cellphone">Cellphone</FieldLabel>
              <Input id="cellphone" {...form.register("cellphone")} />
            </Field>
            <Field>
              <FieldLabel>Calendar colour</FieldLabel>
              <div className="flex gap-2">
                {DEFAULT_COLOURS.map((colour) => (
                  <button
                    key={colour}
                    type="button"
                    aria-label={colour}
                    onClick={() => form.setValue("colourCode", colour, { shouldValidate: true })}
                    className="size-7 rounded-full ring-offset-2 ring-offset-background transition-shadow data-[selected=true]:ring-2 data-[selected=true]:ring-ring"
                    data-selected={form.watch("colourCode") === colour}
                    style={{ backgroundColor: colour }}
                  />
                ))}
              </div>
            </Field>
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

export default function DentistsPage() {
  const { practiceId } = usePracticeContext();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Dentist | null>(null);

  const dentists = useDentists(practiceId ?? "", true);
  const createDentist = useCreateDentist(practiceId ?? "");
  const updateDentist = useUpdateDentist();
  const setArchived = useSetDentistArchived();

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(dentist: Dentist) {
    setEditing(dentist);
    setDialogOpen(true);
  }

  function handleSubmit(values: DentistFormValues) {
    const mutation = editing
      ? updateDentist.mutateAsync({ dentistId: editing.id, input: values })
      : createDentist.mutateAsync(values);

    mutation
      .then(() => {
        toast.success(editing ? "Dentist updated." : "Dentist added.");
        setDialogOpen(false);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Something went wrong."));
  }

  function handleToggleArchived(dentist: Dentist) {
    setArchived.mutate(
      { dentistId: dentist.id, archived: dentist.active },
      {
        onSuccess: () => toast.success(dentist.active ? "Dentist archived." : "Dentist restored."),
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update."),
      }
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dentists</h1>
          <p className="mt-1 text-sm text-muted-foreground">{dentists.data?.length ?? 0} dentists</p>
        </div>
        <Button className="gap-1.5" onClick={openCreate}>
          <PlusIcon className="size-4" />
          Add dentist
        </Button>
      </div>

      {dentists.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : dentists.data?.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <StethoscopeIcon />
          </EmptyMedia>
          <EmptyTitle>No dentists yet</EmptyTitle>
          <EmptyDescription>Add your first dentist to start scheduling appointments.</EmptyDescription>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dentists.data?.map((dentist) => (
            <DentistCard
              key={dentist.id}
              dentist={dentist}
              onEdit={() => openEdit(dentist)}
              onToggleArchived={() => handleToggleArchived(dentist)}
            />
          ))}
        </div>
      )}

      <DentistFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        dentist={editing}
        onSubmit={handleSubmit}
        isSubmitting={createDentist.isPending || updateDentist.isPending}
      />
    </div>
  );
}
