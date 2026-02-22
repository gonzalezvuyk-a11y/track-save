import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Ingresa un email válido').trim(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Ingresa tu nombre completo'),
    email: z.email('Ingresa un email válido').trim(),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
    currency: z.enum(['PYG', 'USD']),
    incomeType: z.enum(['fixed', 'freelance']),
    monthlyIncome: z
      .string()
      .trim()
      .optional()
      .transform((value) => {
        if (!value) return null;
        const numeric = Number(value);
        return Number.isFinite(numeric) && numeric >= 0 ? numeric : Number.NaN;
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  .refine((data) => data.monthlyIncome === null || !Number.isNaN(data.monthlyIncome), {
    message: 'Ingreso mensual inválido',
    path: ['monthlyIncome'],
  });

export const forgotSchema = z.object({
  email: z.email('Ingresa un email válido').trim(),
});

export const resetSchema = z
  .object({
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, 'Nombre completo requerido'),
  currency: z.enum(['PYG', 'USD']),
  income_type: z.enum(['fixed', 'freelance']),
  monthly_income: z
    .string()
    .trim()
    .optional()
    .transform((value) => {
      if (!value) return null;
      const numeric = Number(value);
      return Number.isFinite(numeric) && numeric >= 0 ? numeric : Number.NaN;
    })
    .refine((value) => value === null || !Number.isNaN(value), 'Ingreso mensual inválido'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotInput = z.infer<typeof forgotSchema>;
export type ResetInput = z.infer<typeof resetSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
