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
import { MenuFormValues, menuSchema } from '../schemas/menu-schema';
import { Menu, Permission } from '@prisma/client';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Icons } from '@/components/icons';
import { Icon } from '@/components/icons';

interface MenuFormProps {
  initialData?: MenuFormValues & { id: string };
  permissions: Permission[];
  menus: Menu[];
  mode: 'create' | 'edit';
  onSuccess?: () => void;
  inDialog?: boolean;
}

export function MenuForm({
  initialData,
  permissions,
  menus,
  mode,
  onSuccess,
  inDialog = false
}: MenuFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Filter out the current menu from parent options (to prevent circular references)
  const parentOptions = menus.filter((menu) => menu.id !== initialData?.id);

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuSchema),
    defaultValues: initialData || {
      name: '',
      path: '',
      icon: undefined,
      parentId: undefined,
      order: 0,
      isVisible: true,
      permissions: []
    }
  });

  async function onSubmit(data: MenuFormValues) {
    try {
      setIsLoading(true);
      const url =
        mode === 'create'
          ? '/api/system-management/menus'
          : `/api/system-management/menus/${initialData?.id}`;

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
        throw new Error(error.message || 'Failed to save menu');
      }

      toast.success(
        `Menu ${mode === 'create' ? 'created' : 'updated'} successfully`
      );

      if (onSuccess) {
        onSuccess();
      } else if (!inDialog) {
        router.push('/system-management/menus');
      }

      router.refresh();
    } catch (error) {
      console.error('Error saving menu:', error);
      toast.error('Failed to save menu');
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

  // Get all available icons from the Icons component
  const iconOptions = Object.keys(Icons);

  return (
    <Card className={inDialog ? 'border-0 shadow-none' : ''}>
      {!inDialog && (
        <CardHeader>
          <CardTitle>
            {mode === 'create' ? 'Create Menu' : 'Edit Menu'}
          </CardTitle>
          <CardDescription>
            {mode === 'create'
              ? 'Create a new menu item with permissions'
              : 'Edit menu details and permissions'}
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
                  <FormLabel>Menu Name</FormLabel>
                  <FormControl>
                    <Input placeholder='System Management' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='path'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menu Path</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='/system-management'
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    The URL path for this menu item (leave empty for parent
                    menus with no direct link)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='icon'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select an icon' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className='max-h-80'>
                        <SelectItem value=''>None</SelectItem>
                        {iconOptions.map((icon) => {
                          const IconComponent =
                            Icons[icon as keyof typeof Icons];
                          return (
                            <SelectItem
                              key={icon}
                              value={icon}
                              className='flex items-center gap-2'
                            >
                              <div className='flex items-center gap-2'>
                                <IconComponent className='h-4 w-4' />
                                <span>{icon}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='parentId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Menu</FormLabel>
                    <Select
                      value={field.value || ''}
                      onValueChange={(value) => field.onChange(value || null)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='No parent (root menu)' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value=''>No parent (root menu)</SelectItem>
                        {parentOptions.map((menu) => (
                          <SelectItem key={menu.id} value={menu.id}>
                            {menu.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select a parent menu or leave empty for root level menus
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='order'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={0}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                        value={field.value}
                      />
                    </FormControl>
                    <FormDescription>
                      Lower numbers appear first
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='isVisible'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-base'>Visibility</FormLabel>
                      <FormDescription>
                        Show this menu in the navigation
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='permissions'
              render={() => (
                <FormItem>
                  <div className='mb-4'>
                    <FormLabel>Required Permissions</FormLabel>
                    <FormDescription>
                      Select which permissions are required to view this menu
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
                                    {permission.name}
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
                  onClick={() => router.push('/system-management/menus')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
              <Button type='submit' disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Menu'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
