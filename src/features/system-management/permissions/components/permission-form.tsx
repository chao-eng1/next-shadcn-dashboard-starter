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
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  PermissionFormValues,
  permissionSchema
} from '../schemas/permission-schema';
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

interface PermissionFormProps {
  initialData?: PermissionFormValues & { id: string };
  mode: 'create' | 'edit';
  onSuccess?: () => void;
  inDialog?: boolean;
}

export function PermissionForm({
  initialData,
  mode,
  onSuccess,
  inDialog = false
}: PermissionFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionSchema),
    defaultValues: initialData || {
      name: '',
      description: ''
    }
  });

  async function onSubmit(data: PermissionFormValues) {
    try {
      setIsLoading(true);
      const url =
        mode === 'create'
          ? '/api/system-management/permissions'
          : `/api/system-management/permissions/${initialData?.id}`;

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
        throw new Error(error.message || 'Failed to save permission');
      }

      toast.success(
        `Permission ${mode === 'create' ? 'created' : 'updated'} successfully`
      );

      if (onSuccess) {
        onSuccess();
      } else if (!inDialog) {
        router.push('/system-management/permissions');
      }

      router.refresh();
    } catch (error) {
      console.error('Error saving permission:', error);
      toast.error('Failed to save permission');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className={inDialog ? 'border-0 shadow-none' : ''}>
      {!inDialog && (
        <CardHeader>
          <CardTitle>
            {mode === 'create' ? 'Create Permission' : 'Edit Permission'}
          </CardTitle>
          <CardDescription>
            {mode === 'create'
              ? 'Create a new permission'
              : 'Edit permission details'}
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
                  <FormLabel>Permission Name</FormLabel>
                  <FormControl>
                    <Input placeholder='user:create' {...field} />
                  </FormControl>
                  <FormDescription>
                    Use format like &apos;resource:action&apos; (e.g.,
                    user:create, role:read)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Permission to create new users'
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end space-x-2'>
              {!inDialog && (
                <Button
                  variant='outline'
                  onClick={() => router.push('/system-management/permissions')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
              <Button type='submit' disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Permission'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
