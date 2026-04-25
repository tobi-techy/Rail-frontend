import { z } from 'zod/v4';

// ── Primitives ────────────────────────────────────────────────────────────────

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .max(254, 'Email is too long')
  .email('Please enter a valid email address')
  .refine((v) => !/[<>"']/.test(v), 'Email contains invalid characters');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Z]|[0-9]|[^a-zA-Z0-9]/, 'Must contain a symbol, number, or upper-case letter');

export const nameSchema = z
  .string()
  .trim()
  .min(1, 'Required')
  .max(100, 'Too long')
  .regex(/^[\p{L}\p{M}' -]+$/u, 'Contains invalid characters');

const E164_REGEX = /^\+[1-9]\d{7,14}$/;
export const phoneSchema = z
  .string()
  .trim()
  .regex(E164_REGEX, 'Enter a valid phone number (e.g. +2348012345678)');

export const dateOfBirthSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format')
  .refine((v) => !isNaN(Date.parse(v)), 'Invalid date')
  .refine((v) => {
    const dob = new Date(v);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age >= 18;
  }, 'You must be at least 18 years old');

export const railTagSchema = z
  .string()
  .min(3, 'At least 3 characters')
  .max(30, 'Max 30 characters')
  .regex(/^[a-z0-9]+$/, 'Lowercase letters and numbers only');

export const postalCodeSchema = z.string().trim().min(1, 'Postal code is required').max(20);

// ── Composite schemas ─────────────────────────────────────────────────────────

export const signinSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signupSchema = z.object({ email: emailSchema });

export const forgotPasswordEmailSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const personalInfoSchema = z.object({
  firstName: nameSchema.describe('First name'),
  lastName: nameSchema.describe('Last name'),
});

export const addressSchema = z.object({
  street: z.string().trim().min(1, 'Street address is required').max(200),
  city: z.string().trim().min(1, 'City is required').max(100),
  state: z.string().trim().min(1, 'State is required').max(100),
  postalCode: postalCodeSchema,
  country: z.string().min(1, 'Country is required'),
});

export const profileEditSchema = z.object({
  firstName: nameSchema.optional().or(z.literal('')),
  lastName: nameSchema.optional().or(z.literal('')),
  phone: phoneSchema.or(z.literal('')),
  dateOfBirth: dateOfBirthSchema.or(z.literal('')),
  street: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().optional(),
});

// ── Helper ────────────────────────────────────────────────────────────────────

/** Extract the first error message for a given field from a ZodError */
export function fieldError(error: z.ZodError | null, field: string): string {
  if (!error) return '';
  const issue = error.issues.find((i) => i.path[0] === field);
  return issue?.message ?? '';
}
