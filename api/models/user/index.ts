import { z } from 'zod';

export const UserRoleSchema = z.enum(['SUPER_ADMIN', 'GYM_ADMIN', 'TRAINER', 'MEMBER']);

export const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: UserRoleSchema,
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  gymId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
