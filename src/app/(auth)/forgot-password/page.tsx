"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requestPasswordResetAction } from "@/features/auth/actions";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/features/auth/schemas";

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setIsSubmitting(true);
    await requestPasswordResetAction(values);
    setIsSubmitting(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2Icon className="size-6" />
        </span>
        <h1 className="mt-4 font-heading text-xl font-semibold text-foreground">Check your email</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          If an account exists for that address, we&apos;ve sent a link to reset your password.
        </p>
        <Link href="/login" className="mt-6 text-sm font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-heading text-xl font-semibold text-foreground">Reset your password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your email and we&apos;ll send you a link to reset it.
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="mt-6">
        <FieldGroup>
          <Field data-invalid={!!form.formState.errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" {...form.register("email")} />
            <FieldError errors={[form.formState.errors.email]} />
          </Field>
        </FieldGroup>

        <Button type="submit" disabled={isSubmitting} className="mt-6 w-full">
          {isSubmitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
