import { z } from 'zod';
import { UserRoleSchema } from '../user';

export const CreateGymSchema = z.object({
  // Gym details
  name: z.string().min(1, 'Gym name is required'),
  ownerName: z.string().min(1, 'Owner name is required'),
  email: z.string().email('Invalid gym email address'),
  phone: z.string().min(10, 'Phone number is required'),
  subscriptionPlanId: z.string().uuid('Invalid subscription plan ID'),
  
  // Admin details
  adminFirstName: z.string().min(1, 'Admin first name is required'),
  adminLastName: z.string().optional(),
  adminEmail: z.string().email('Invalid admin email address'),
  adminPassword: z.string().min(8, 'Admin password must be at least 8 characters'),
  adminPhone: z.string().optional(),
});

export type CreateGymInput = z.infer<typeof CreateGymSchema>;
