"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StepContainer } from "../step-container";
import { StepHeader } from "../step-header";
import { useBookingStore } from "../../store/booking-store";
import {
  patientDetailsSchema,
  type PatientDetailsFormValues,
} from "../../validation/patient-details-schema";

export function PatientDetailsStep() {
  const patient = useBookingStore((s) => s.patient);
  const submitPatientDetails = useBookingStore((s) => s.submitPatientDetails);

  const form = useForm<PatientDetailsFormValues>({
    resolver: zodResolver(patientDetailsSchema),
    mode: "onBlur",
    defaultValues: patient ?? {
      firstName: "",
      surname: "",
      mobileNumber: "",
      email: "",
      notes: "",
    },
  });

  const { errors } = form.formState;

  return (
    <StepContainer>
      <StepHeader
        eyebrow="Step 5 of 6"
        title="Your details"
        description="We'll use this to confirm your appointment."
      />

      <form
        onSubmit={form.handleSubmit((values) => submitPatientDetails(values))}
        noValidate
      >
        <FieldGroup>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.firstName}>
              <FieldLabel htmlFor="firstName">First name</FieldLabel>
              <Input
                id="firstName"
                autoComplete="given-name"
                aria-invalid={!!errors.firstName}
                {...form.register("firstName")}
              />
              <FieldError errors={[errors.firstName]} />
            </Field>

            <Field data-invalid={!!errors.surname}>
              <FieldLabel htmlFor="surname">Surname</FieldLabel>
              <Input
                id="surname"
                autoComplete="family-name"
                aria-invalid={!!errors.surname}
                {...form.register("surname")}
              />
              <FieldError errors={[errors.surname]} />
            </Field>
          </div>

          <Field data-invalid={!!errors.mobileNumber}>
            <FieldLabel htmlFor="mobileNumber">Mobile number</FieldLabel>
            <Input
              id="mobileNumber"
              type="tel"
              autoComplete="tel"
              placeholder="082 123 4567"
              aria-invalid={!!errors.mobileNumber}
              {...form.register("mobileNumber")}
            />
            <FieldError errors={[errors.mobileNumber]} />
          </Field>

          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">Email address</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              {...form.register("email")}
            />
            <FieldError errors={[errors.email]} />
          </Field>

          <Field data-invalid={!!errors.notes}>
            <FieldLabel htmlFor="notes">
              Notes <span className="font-normal text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Anything we should know before your visit?"
              aria-invalid={!!errors.notes}
              {...form.register("notes")}
            />
            <FieldError errors={[errors.notes]} />
          </Field>
        </FieldGroup>

        <Button type="submit" className="mt-8 w-full sm:w-auto">
          Continue to review
        </Button>
      </form>
    </StepContainer>
  );
}
