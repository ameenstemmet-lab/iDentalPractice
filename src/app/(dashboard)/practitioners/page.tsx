"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { StethoscopeIcon } from "lucide-react";
import { SkeletonCard } from "@/components/shared/skeleton-patterns";
import { PractitionerCard } from "@/components/reception/practitioner-card";
import { usePracticeContext } from "@/components/reception/practice-context";
import {
  useCreatePractitioner,
  usePractitioners,
  usePractitionerTreatmentIds,
  useProfessions,
  useSetPractitionerArchived,
  useSetPractitionerTreatments,
  useUpdatePractitioner,
} from "@/features/reception/practitioners/queries";
import type { Practitioner } from "@/features/reception/practitioners/types";
import { useTreatments } from "@/features/reception/treatments/queries";

const practitionerSchema = z.object({
  firstName: z.string().trim().min(1, "Required"),
  lastName: z.string().trim().min(1, "Required"),
  title: z.string().trim().optional(),
  profession: z.string().trim().min(1, "Required — e.g. Dentist, GP, Physiotherapist"),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  cellphone: z.string().trim().optional(),
  colourCode: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Use a hex colour like #2563EB"),
  consultationDuration: z.number().int().positive("Must be positive"),
});

type PractitionerFormValues = z.infer<typeof practitionerSchema>;

const DEFAULT_COLOURS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

function PractitionerFormDialog({
  open,
  onOpenChange,
  practiceId,
  practitioner,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  practiceId: string;
  practitioner: Practitioner | null;
  onSubmit: (values: PractitionerFormValues, treatmentIds: string[]) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<PractitionerFormValues>({
    resolver: zodResolver(practitionerSchema),
    values: practitioner
      ? {
          firstName: practitioner.firstName,
          lastName: practitioner.lastName,
          title: practitioner.title ?? "",
          profession: practitioner.profession,
          email: practitioner.email ?? "",
          cellphone: practitioner.cellphone ?? "",
          colourCode: practitioner.colourCode,
          consultationDuration: practitioner.consultationDuration,
        }
      : {
          firstName: "",
          lastName: "",
          title: "",
          profession: "",
          email: "",
          cellphone: "",
          colourCode: DEFAULT_COLOURS[0],
          consultationDuration: 30,
        },
  });

  const professions = useProfessions(practiceId);
  const treatments = useTreatments(practiceId);
  const assignedTreatmentIds = usePractitionerTreatmentIds(practitioner?.id);
  const [selectedTreatmentIds, setSelectedTreatmentIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (open) setSelectedTreatmentIds(assignedTreatmentIds.data ?? []);
  }, [open, assignedTreatmentIds.data]);

  function toggleTreatment(treatmentId: string, checked: boolean) {
    setSelectedTreatmentIds((current) =>
      checked ? [...current, treatmentId] : current.filter((id) => id !== treatmentId)
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{practitioner ? "Edit practitioner" : "Add practitioner"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((values) => onSubmit(values, selectedTreatmentIds))}
          noValidate
        >
          <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!form.formState.errors.title}>
                <FieldLabel htmlFor="title">Title</FieldLabel>
                <Input id="title" placeholder="Dr., Mr., Ms.…" {...form.register("title")} />
              </Field>
              <Field data-invalid={!!form.formState.errors.profession}>
                <FieldLabel htmlFor="profession">Profession</FieldLabel>
                <Input
                  id="profession"
                  list="profession-suggestions"
                  placeholder="Dentist, GP, Physiotherapist…"
                  {...form.register("profession")}
                />
                <datalist id="profession-suggestions">
                  {(professions.data ?? []).map((profession) => (
                    <option key={profession} value={profession} />
                  ))}
                </datalist>
                <FieldError errors={[form.formState.errors.profession]} />
              </Field>
            </div>
            <Field data-invalid={!!form.formState.errors.consultationDuration}>
              <FieldLabel htmlFor="consultationDuration">Consultation (min)</FieldLabel>
              <Input
                id="consultationDuration"
                type="number"
                {...form.register("consultationDuration", { valueAsNumber: true })}
              />
              <FieldError errors={[form.formState.errors.consultationDuration]} />
            </Field>
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
            <Field>
              <FieldLabel>Treatments offered</FieldLabel>
              {treatments.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading treatments…</p>
              ) : treatments.data?.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No treatments exist yet — add some under Treatments first.
                </p>
              ) : (
                <div className="flex max-h-40 flex-col gap-2 overflow-y-auto rounded-md border border-border p-3">
                  {treatments.data?.map((treatment) => (
                    <label key={treatment.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={selectedTreatmentIds.includes(treatment.id)}
                        onCheckedChange={(checked) => toggleTreatment(treatment.id, checked === true)}
                      />
                      {treatment.treatmentName}
                    </label>
                  ))}
                </div>
              )}
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

export default function PractitionersPage() {
  const { practiceId } = usePracticeContext();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Practitioner | null>(null);

  const practitioners = usePractitioners(practiceId ?? "", true);
  const createPractitioner = useCreatePractitioner(practiceId ?? "");
  const updatePractitioner = useUpdatePractitioner();
  const setArchived = useSetPractitionerArchived();
  const setTreatments = useSetPractitionerTreatments();

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(practitioner: Practitioner) {
    setEditing(practitioner);
    setDialogOpen(true);
  }

  async function handleSubmit(values: PractitionerFormValues, treatmentIds: string[]) {
    if (!practiceId) return;
    try {
      const saved = editing
        ? await updatePractitioner.mutateAsync({ practitionerId: editing.id, input: values })
        : await createPractitioner.mutateAsync(values);
      await setTreatments.mutateAsync({ practiceId, practitionerId: saved.id, treatmentIds });
      toast.success(editing ? "Practitioner updated." : "Practitioner added.");
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  function handleToggleArchived(practitioner: Practitioner) {
    setArchived.mutate(
      { practitionerId: practitioner.id, archived: practitioner.active },
      {
        onSuccess: () => toast.success(practitioner.active ? "Practitioner archived." : "Practitioner restored."),
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update."),
      }
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Practitioners</h1>
          <p className="mt-1 text-sm text-muted-foreground">{practitioners.data?.length ?? 0} practitioners</p>
        </div>
        <Button className="gap-1.5" onClick={openCreate}>
          <PlusIcon className="size-4" />
          Add practitioner
        </Button>
      </div>

      {practitioners.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : practitioners.data?.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <StethoscopeIcon />
          </EmptyMedia>
          <EmptyTitle>No practitioners yet</EmptyTitle>
          <EmptyDescription>Add your first practitioner to start scheduling appointments.</EmptyDescription>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {practitioners.data?.map((practitioner) => (
            <PractitionerCard
              key={practitioner.id}
              practitioner={practitioner}
              onEdit={() => openEdit(practitioner)}
              onToggleArchived={() => handleToggleArchived(practitioner)}
            />
          ))}
        </div>
      )}

      <PractitionerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        practiceId={practiceId ?? ""}
        practitioner={editing}
        onSubmit={handleSubmit}
        isSubmitting={createPractitioner.isPending || updatePractitioner.isPending || setTreatments.isPending}
      />
    </div>
  );
}
