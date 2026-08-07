import { z } from "zod";

export const signUpSchema = z.object({
  practiceName: z.string().trim().min(1, "Practice name is required"),
  yourName: z.string().trim().min(1, "Your name is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Must be at least 8 characters"),
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const setPasswordSchema = z.object({
  password: z.string().min(8, "Must be at least 8 characters"),
});

export type SetPasswordFormValues = z.infer<typeof setPasswordSchema>;
