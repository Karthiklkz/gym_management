import { z } from 'zod';

export const MemberSchema = z.object({
  userId: z.string().uuid('Invalid User ID'),
  medicalNotes: z.string().optional(),
});

export type MemberInput = z.infer<typeof MemberSchema>;
