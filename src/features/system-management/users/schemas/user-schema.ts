import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.'
  }),
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email('This is not a valid email.'),
  password: z
    .string()
    .min(8, {
      message: 'Password must be at least 8 characters.'
    })
    .optional(),
  image: z.string().optional(),
  roles: z.array(z.string()).min(1, {
    message: 'At least one role must be selected.'
  })
});

export type UserFormValues = z.infer<typeof userSchema>;

export const userUpdateSchema = userSchema.omit({ password: true }).extend({
  password: z
    .string()
    .min(8, {
      message: 'Password must be at least 8 characters.'
    })
    .optional()
    .or(z.literal(''))
});

export type UserUpdateFormValues = z.infer<typeof userUpdateSchema>;
