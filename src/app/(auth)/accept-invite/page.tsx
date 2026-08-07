"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { setPasswordAction } from "@/features/auth/actions";
import { setPasswordSchema, type SetPasswordFormValues } from "@/features/auth/schemas";

type LinkStatus = "checking" | "valid" | "invalid";

export default function AcceptInvitePage() {
  const [status, setStatus] = React.useState<LinkStatus>("checking");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const form = useForm<SetPasswordFormValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: "" },
  });

  React.useEffect(() => {
    // The invite/reset-password email link redirects here with the session
    // encoded in the URL hash — the browser client (cookie-backed via
    // @supabase/ssr) picks it up automatically on init and syncs it to
    // cookies, which is what lets setPasswordAction see it server-side.
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus(session ? "valid" : "invalid");
    });
  }, []);

  async function onSubmit(values: SetPasswordFormValues) {
    setIsSubmitting(true);
    try {
      const result = await setPasswordAction(values);
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

  if (status === "checking") {
    return <p className="text-center text-sm text-muted-foreground">Checking your link…</p>;
  }

  if (status === "invalid") {
    return (
      <div className="text-center">
        <h1 className="font-heading text-xl font-semibold text-foreground">Link expired</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          This link is no longer valid. Request a new one and try again.
        </p>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-heading text-xl font-semibold text-foreground">Set your password</h1>
      <p className="mt-1 text-sm text-muted-foreground">Choose a password to finish setting up your account.</p>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="mt-6">
        <FieldGroup>
          <Field data-invalid={!!form.formState.errors.password}>
            <FieldLabel htmlFor="password">New password</FieldLabel>
            <Input id="password" type="password" {...form.register("password")} />
            <FieldError errors={[form.formState.errors.password]} />
          </Field>
        </FieldGroup>

        <Button type="submit" disabled={isSubmitting} className="mt-6 w-full">
          {isSubmitting ? "Saving…" : "Save and continue"}
        </Button>
      </form>
    </>
  );
}
