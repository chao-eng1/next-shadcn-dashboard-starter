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
import { RoleFormValues, roleSchema } from '../schemas/role-schema';
import { Permission } from '@prisma/client';
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

interface RoleFormProps {
  initialData?: RoleFormValues & { id: string };
  permissions: Permission[];
  mode: 'create' | 'edit';
  onSuccess?: () => void;
  inDialog?: boolean;
}

export function RoleForm({
  initialData,
  permissions,
  mode,
  onSuccess,
  inDialog = false
}: RoleFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      permissions: []
    }
  });

  async function onSubmit(data: RoleFormValues) {
    try {
      setIsLoading(true);
      const url =
        mode === 'create'
          ? '/api/system-management/roles'
          : `/api/system-management/roles/${initialData?.id}`;

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
        throw new Error(error.message || 'Failed to save role');
      }

      toast.success(
        `Role ${mode === 'create' ? 'created' : 'updated'} successfully`
      );

      if (onSuccess) {
        onSuccess();
      } else if (!inDialog) {
        router.push('/system-management/roles');
      }

      router.refresh();
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error('Failed to save role');
    } finally {
      setIsLoading(false);
    }
  }

  // Group permissions by their prefix (e.g., 'user:create', 'user:read' -> 'user')
  const groupedPermissions = permissions.reduce(
    (acc, permission) => {
      const group = permission.name.split(':')[0];
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  return (
    <Card className={inDialog ? 'border-0 shadow-none' : ''}>
      {!inDialog && (
        <CardHeader>
          <CardTitle>
            {mode === 'create' ? 'Create Role' : 'Edit Role'}
          </CardTitle>
          <CardDescription>
            {mode === 'create'
              ? 'Create a new role with permissions'
              : 'Edit role details and permissions'}
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
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Admin' {...field} />
                  </FormControl>
                  <FormDescription>
                    The name of the role (e.g., Admin, Editor, User)
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
                      placeholder='Administrator with full system access'
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='permissions'
              render={() => (
                <FormItem>
                  <div className='mb-4'>
                    <FormLabel>Permissions</FormLabel>
                    <FormDescription>
                      Select the permissions for this role
                    </FormDescription>
                  </div>

                  {Object.entries(groupedPermissions).map(([group, perms]) => (
                    <div key={group} className='mb-6'>
                      <h3 className='mb-3 text-sm font-medium capitalize'>
                        {group} Permissions
                      </h3>
                      <div className='space-y-2'>
                        {perms.map((permission) => (
                          <FormField
                            key={permission.id}
                            control={form.control}
                            name='permissions'
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={permission.id}
                                  className='flex flex-row items-start space-y-0 space-x-3'
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(
                                        permission.id
                                      )}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([
                                              ...field.value,
                                              permission.id
                                            ])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) =>
                                                  value !== permission.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className='font-normal'>
                                    {permission.name.split(':')[1] ||
                                      permission.name}
                                    {permission.description && (
                                      <span className='text-muted-foreground block text-xs'>
                                        {permission.description}
                                      </span>
                                    )}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}

                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end space-x-2'>
              {!inDialog && (
                <Button
                  variant='outline'
                  onClick={() => router.push('/system-management/roles')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
              <Button type='submit' disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Role'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
