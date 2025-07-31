import { z } from 'zod';

export const permissionSchema = z.object({
  name: z.string().min(2, {
    message: 'Permission name must be at least 2 characters.'
  }),
  description: z.string().optional()
});

export type PermissionFormValues = z.infer<typeof permissionSchema>;
