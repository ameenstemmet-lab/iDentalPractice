import { z } from "zod";

// Lenient international-friendly mobile check: optional leading +country
// code, 9–12 digits total once spaces/dashes are stripped.
const MOBILE_REGEX = /^\+?\d{9,12}$/;

export const patientDetailsSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(60, "First name is too long"),
  surname: z.string().trim().min(1, "Surname is required").max(60, "Surname is too long"),
  mobileNumber: z
    .string()
    .trim()
    .transform((value) => value.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(MOBILE_REGEX, "Enter a valid mobile number")),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  notes: z.string().trim().max(500, "Notes must be under 500 characters").optional(),
});

export type PatientDetailsFormValues = z.infer<typeof patientDetailsSchema>;
