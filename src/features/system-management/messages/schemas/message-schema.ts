import * as z from 'zod';

// Schema for sending a new message
export const messageFormSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  content: z.string().min(1, { message: 'Content is required' }),
  isGlobal: z.boolean().default(false),
  recipientType: z.enum(['global', 'roles', 'users']),
  roleIds: z.array(z.string()).optional(),
  recipientIds: z.array(z.string()).optional(),
  includeSender: z.boolean().default(false)
});

// Type for the form values
export type MessageFormValues = z.infer<typeof messageFormSchema>;

// Default values for the message form
export const defaultMessageValues: Partial<MessageFormValues> = {
  title: '',
  content: '',
  isGlobal: false,
  recipientType: 'global',
  roleIds: [],
  recipientIds: [],
  includeSender: false
};
