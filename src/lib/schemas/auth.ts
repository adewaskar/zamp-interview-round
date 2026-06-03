import { z } from "zod";

/** Source of truth for auth request bodies + client form validation. */
export const signupSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email")
    .max(200),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200),
  name: z.string().max(80).optional(),
});
export type SignupBody = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
export type LoginBody = z.infer<typeof loginSchema>;
