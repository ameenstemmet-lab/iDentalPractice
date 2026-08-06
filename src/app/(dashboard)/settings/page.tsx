"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePracticeContext } from "@/components/reception/practice-context";
import { usePracticeSettings, useUpdatePracticeSettings } from "@/features/reception/settings/queries";

const settingsSchema = z.object({
  practiceName: z.string().trim().min(1, "Required"),
  registrationNumber: z.string().trim().optional(),
  email: z.string().trim().email("Invalid email"),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  province: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  logoUrl: z.string().trim().optional(),
  timezone: z.string().trim().min(1, "Required"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

function PracticeDetailsForm({ practiceId }: { practiceId: string }) {
  const { data: settings, isLoading } = usePracticeSettings(practiceId);
  const update = useUpdatePracticeSettings(practiceId);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    values: settings
      ? {
          practiceName: settings.practiceName,
          registrationNumber: settings.registrationNumber ?? "",
          email: settings.email,
          phone: settings.phone ?? "",
          address: settings.address ?? "",
          city: settings.city ?? "",
          province: settings.province ?? "",
          postalCode: settings.postalCode ?? "",
          logoUrl: settings.logoUrl ?? "",
          timezone: settings.timezone,
        }
      : undefined,
  });

  if (isLoading) return <Skeleton className="h-96 w-full max-w-2xl" />;

  function onSubmit(values: SettingsFormValues) {
    update.mutate(values, {
      onSuccess: () => toast.success("Practice details saved."),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to save."),
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Practice details</CardTitle>
          <CardDescription>Shown on confirmations and used as the default timezone for scheduling.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!form.formState.errors.practiceName}>
                <FieldLabel htmlFor="practiceName">Practice name</FieldLabel>
                <Input id="practiceName" {...form.register("practiceName")} />
                <FieldError errors={[form.formState.errors.practiceName]} />
              </Field>
              <Field data-invalid={!!form.formState.errors.registrationNumber}>
                <FieldLabel htmlFor="registrationNumber">Registration number</FieldLabel>
                <Input id="registrationNumber" {...form.register("registrationNumber")} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!form.formState.errors.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" type="email" {...form.register("email")} />
                <FieldError errors={[form.formState.errors.email]} />
              </Field>
              <Field data-invalid={!!form.formState.errors.phone}>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <Input id="phone" {...form.register("phone")} />
              </Field>
            </div>
            <Field data-invalid={!!form.formState.errors.logoUrl}>
              <FieldLabel htmlFor="logoUrl">Logo URL</FieldLabel>
              <Input id="logoUrl" placeholder="https://…" {...form.register("logoUrl")} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="address">Street address</FieldLabel>
              <Input id="address" {...form.register("address")} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field>
                <FieldLabel htmlFor="city">City</FieldLabel>
                <Input id="city" {...form.register("city")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="province">Province</FieldLabel>
                <Input id="province" {...form.register("province")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="postalCode">Postal code</FieldLabel>
                <Input id="postalCode" {...form.register("postalCode")} />
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business hours &amp; timezone</CardTitle>
          <CardDescription>
            Per-dentist working hours are set on the{" "}
            <a href="/working-hours" className="text-primary hover:underline">
              Working Hours
            </a>{" "}
            page — this timezone is the practice-wide default used across scheduling.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field data-invalid={!!form.formState.errors.timezone} className="max-w-xs">
            <FieldLabel htmlFor="timezone">Timezone (IANA)</FieldLabel>
            <Input id="timezone" placeholder="Africa/Johannesburg" {...form.register("timezone")} />
            <FieldError errors={[form.formState.errors.timezone]} />
          </Field>
        </CardContent>
      </Card>

      <div>
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

export default function SettingsPage() {
  const { practiceId } = usePracticeContext();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Practice details, branding, and business hours.</p>
      </div>
      {practiceId ? <PracticeDetailsForm practiceId={practiceId} /> : <Skeleton className="h-96 w-full max-w-2xl" />}
    </div>
  );
}
