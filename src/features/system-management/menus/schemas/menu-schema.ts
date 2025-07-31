import { z } from 'zod';

export const menuSchema = z.object({
  name: z.string().min(2, {
    message: 'Menu name must be at least 2 characters.'
  }),
  path: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().optional().nullable(),
  order: z.number().int().nonnegative().default(0),
  isVisible: z.boolean().default(true),
  permissions: z.array(z.string()).min(1, {
    message: 'At least one permission must be selected.'
  })
});

export type MenuFormValues = z.infer<typeof menuSchema>;
