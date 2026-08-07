"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/features/auth/actions";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas";

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    try {
      const result = await loginAction(values);
      if (result && !result.ok) {
        toast.error(result.message);
        setIsSubmitting(false);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) throw err;
      toast.error("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="font-heading text-xl font-semibold text-foreground">Sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">Welcome back — sign in to your practice dashboard.</p>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="mt-6">
        <FieldGroup>
          <Field data-invalid={!!form.formState.errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" {...form.register("email")} />
            <FieldError errors={[form.formState.errors.email]} />
          </Field>
          <Field data-invalid={!!form.formState.errors.password}>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input id="password" type="password" {...form.register("password")} />
            <FieldError errors={[form.formState.errors.password]} />
          </Field>
        </FieldGroup>

        <Button type="submit" disabled={isSubmitting} className="mt-6 w-full">
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have a practice yet?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Start your practice
        </Link>
      </p>
    </>
  );
}
