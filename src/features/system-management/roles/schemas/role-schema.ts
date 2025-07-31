import { z } from 'zod';

export const roleSchema = z.object({
  name: z.string().min(2, {
    message: 'Role name must be at least 2 characters.'
  }),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, {
    message: 'At least one permission must be selected.'
  })
});

export type RoleFormValues = z.infer<typeof roleSchema>;
