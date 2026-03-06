import { z } from "zod";

// ─── Registration Validation Schema ────────────────────────────────────────

export const RegistrationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "নাম কমপক্ষে ২ অক্ষর হতে হবে")
      .max(50, "নাম ৫০ অক্ষরের বেশি হতে পারবে না"),
    email: z
      .string()
      .trim()
      .email("অনুগ্রহ করে একটি বৈধ ইমেইল ঠিকানা প্রদান করুন"),
    phone: z
      .string()
      .trim()
      .regex(
        /^(\+88)?01[0-9]{9}$/,
        "অনুগ্রহ করে একটি বৈধ বাংলাদেশের ফোন নম্বর প্রদান করুন (যেমন: +8801XXXXXXXXX বা 01XXXXXXXXX)",
      ),
    password: z
      .string()
      .min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "পাসওয়ার্ড কমপক্ষে একটি বড় হরফ, একটি ছোট হরফ এবং একটি সংখ্যা থাকতে হবে",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "পাসওয়ার্ড এবং নিশ্চিত পাসওয়ার্ড মিলতে হবে",
    path: ["confirmPassword"],
  });

export type RegistrationFormData = z.infer<typeof RegistrationSchema>;

// ─── Login Validation Schema ──────────────────────────────────────────────

export const LoginSchema = z.object({
  emailOrPhone: z.string().trim().min(1, "ইমেইল বা ফোন নম্বর প্রয়োজন"),
  password: z.string().min(1, "পাসওয়ার্ড প্রয়োজন"),
});

export type LoginFormData = z.infer<typeof LoginSchema>;

// ─── Email Verification Schema ────────────────────────────────────────────

export const EmailVerificationSchema = z.object({
  code: z
    .string()
    .length(6, "যাচাইকরণ কোড ৬ সংখ্যার হতে হবে")
    .regex(/^\d+$/, "যাচাইকরণ কোড শুধুমাত্র সংখ্যা থাকতে হবে"),
});

export type EmailVerificationData = z.infer<typeof EmailVerificationSchema>;

// ─── Validation Error Handler ─────────────────────────────────────────────

export function getValidationErrorMessage(
  error: z.ZodError<unknown>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  error.issues.forEach((err: z.ZodIssue) => {
    if (err.path.length > 0) {
      const fieldName = err.path[0] as string;
      errors[fieldName] = err.message;
    }
  });
  return errors;
}

// ─── Field Validators ─────────────────────────────────────────────────────

export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
  },
  phone: (phone: string): boolean => {
    const phoneRegex = /^(\+88)?01[0-9]{9}$/;
    return phoneRegex.test(phone);
  },
  password: (password: string): boolean => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    return password.length >= 8 && hasUpperCase && hasLowerCase && hasNumber;
  },
  passwordStrength: (password: string): "weak" | "medium" | "strong" => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;

    if (strength <= 2) return "weak";
    if (strength <= 4) return "medium";
    return "strong";
  },
};
