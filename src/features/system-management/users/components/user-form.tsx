'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  UserFormValues,
  userSchema,
  userUpdateSchema
} from '../schemas/user-schema';
import { Role } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState } from 'react';

interface UserFormProps {
  initialData?: UserFormValues & { id: string };
  roles: Role[];
  mode: 'create' | 'edit';
  onSuccess?: () => void;
  inDialog?: boolean;
}

export function UserForm({
  initialData,
  roles,
  mode,
  onSuccess,
  inDialog = false
}: UserFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(mode === 'create' ? userSchema : userUpdateSchema),
    defaultValues: initialData || {
      name: '',
      email: '',
      password: '',
      roles: []
    }
  });

  async function onSubmit(data: UserFormValues) {
    try {
      setIsLoading(true);
      const url =
        mode === 'create'
          ? '/api/system-management/users'
          : `/api/system-management/users/${initialData?.id}`;

      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save user');
      }

      toast.success(
        `User ${mode === 'create' ? 'created' : 'updated'} successfully`
      );

      if (onSuccess) {
        onSuccess();
      } else if (!inDialog) {
        router.push('/system-management/users');
      }

      router.refresh();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Failed to save user');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className={inDialog ? 'border-0 shadow-none' : ''}>
      {!inDialog && (
        <CardHeader>
          <CardTitle>
            {mode === 'create' ? 'Create User' : 'Edit User'}
          </CardTitle>
          <CardDescription>
            {mode === 'create'
              ? 'Create a new user with roles'
              : 'Edit user details and roles'}
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className={inDialog ? 'px-0' : ''}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder='John Doe' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder='john@example.com' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {mode === 'create' ? 'Password' : 'New Password (Optional)'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      placeholder={
                        mode === 'create'
                          ? 'Create a password'
                          : 'Leave blank to keep current password'
                      }
                      {...field}
                    />
                  </FormControl>
                  {mode === 'edit' && (
                    <FormDescription>
                      Leave blank to keep the current password.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='roles'
              render={() => (
                <FormItem>
                  <div className='mb-4'>
                    <FormLabel>Roles</FormLabel>
                    <FormDescription>
                      Select the roles for this user
                    </FormDescription>
                  </div>
                  {roles.map((role) => (
                    <FormField
                      key={role.id}
                      control={form.control}
                      name='roles'
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={role.id}
                            className='flex flex-row items-start space-y-0 space-x-3'
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(role.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, role.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== role.id
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className='font-normal'>
                              {role.name}
                              {role.description && (
                                <span className='text-muted-foreground block text-xs'>
                                  {role.description}
                                </span>
                              )}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex justify-end space-x-2'>
              {!inDialog && (
                <Button
                  variant='outline'
                  onClick={() => router.push('/system-management/users')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
              <Button type='submit' disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save User'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
