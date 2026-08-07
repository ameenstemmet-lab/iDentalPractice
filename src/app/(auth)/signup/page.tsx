"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signUpAction } from "@/features/auth/actions";
import { signUpSchema, type SignUpFormValues } from "@/features/auth/schemas";

export default function SignUpPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { practiceName: "", yourName: "", email: "", password: "" },
  });

  async function onSubmit(values: SignUpFormValues) {
    setIsSubmitting(true);
    try {
      const result = await signUpAction(values);
      if (result && !result.ok) {
        toast.error(result.message);
        setIsSubmitting(false);
      }
      // On success, signUpAction redirects server-side — no further client action needed.
    } catch (err) {
      // Next.js redirect() throws internally; anything else is a real failure.
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) throw err;
      toast.error("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="font-heading text-xl font-semibold text-foreground">Start your practice</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Create your practice and admin account — takes about a minute.
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="mt-6">
        <FieldGroup>
          <Field data-invalid={!!form.formState.errors.practiceName}>
            <FieldLabel htmlFor="practiceName">Practice name</FieldLabel>
            <Input id="practiceName" placeholder="Stemmet Dental" {...form.register("practiceName")} />
            <FieldError errors={[form.formState.errors.practiceName]} />
          </Field>
          <Field data-invalid={!!form.formState.errors.yourName}>
            <FieldLabel htmlFor="yourName">Your name</FieldLabel>
            <Input id="yourName" placeholder="Jane Smith" {...form.register("yourName")} />
            <FieldError errors={[form.formState.errors.yourName]} />
          </Field>
          <Field data-invalid={!!form.formState.errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" placeholder="you@practice.co.za" {...form.register("email")} />
            <FieldError errors={[form.formState.errors.email]} />
          </Field>
          <Field data-invalid={!!form.formState.errors.password}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input id="password" type="password" {...form.register("password")} />
            <FieldError errors={[form.formState.errors.password]} />
          </Field>
        </FieldGroup>

        <Button type="submit" disabled={isSubmitting} className="mt-6 w-full">
          {isSubmitting ? "Creating your practice…" : "Create practice"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
