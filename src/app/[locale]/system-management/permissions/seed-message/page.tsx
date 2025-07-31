'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/components/permission-gate';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Separator } from '@/components/ui/separator';

export default function SeedMessagePermissionsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSeed = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        '/api/system-management/permissions/seed-message',
        {
          method: 'POST'
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to seed permissions');
      }

      await response.json();
      toast.success('Message permissions seeded successfully');

      // Refresh RBAC context
      router.refresh();
    } catch (error) {
      console.error('Error seeding permissions:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to seed permissions'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PermissionGate role='admin'>
      <div className='container mx-auto px-4 py-8 md:px-6 lg:px-8'>
        <div className='mx-auto mb-8 max-w-5xl'>
          <h1 className='text-3xl font-bold'>Seed Message Permissions</h1>
          <p className='text-muted-foreground'>
            Ensure all message permissions are created and assigned to admin
            role
          </p>
        </div>

        <Card className='border-muted/20 mx-auto max-w-5xl rounded-xl shadow-sm'>
          <CardHeader>
            <CardTitle>Message Permissions</CardTitle>
            <CardDescription>
              This will create and assign all necessary message permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='rounded-lg border p-4'>
                <h3 className='font-medium'>Available Permissions</h3>
                <Separator className='my-2' />
                <ul className='space-y-2'>
                  <li className='flex items-center gap-2'>
                    <div className='h-2 w-2 rounded-full bg-green-500'></div>
                    <span className='font-mono text-sm'>message.send</span> -
                    Can send messages to users
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-2 w-2 rounded-full bg-green-500'></div>
                    <span className='font-mono text-sm'>message.read</span> -
                    Can read messages
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-2 w-2 rounded-full bg-green-500'></div>
                    <span className='font-mono text-sm'>message.edit</span> -
                    Can edit existing messages
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-2 w-2 rounded-full bg-green-500'></div>
                    <span className='font-mono text-sm'>message.delete</span> -
                    Can delete messages
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-2 w-2 rounded-full bg-green-500'></div>
                    <span className='font-mono text-sm'>message.manage</span> -
                    Can manage all messages
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-2 w-2 rounded-full bg-green-500'></div>
                    <span className='font-mono text-sm'>message:manage</span> -
                    Can manage all messages (colon format)
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-2 w-2 rounded-full bg-green-500'></div>
                    <span className='font-mono text-sm'>message:send</span> -
                    Can send messages to users (colon format)
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-2 w-2 rounded-full bg-green-500'></div>
                    <span className='font-mono text-sm'>message:edit</span> -
                    Can edit messages (colon format)
                  </li>
                </ul>
              </div>

              <div className='flex justify-between'>
                <Button
                  variant='outline'
                  onClick={() => router.push('/system-management/permissions')}
                >
                  返回权限管理
                </Button>

                <Button
                  onClick={handleSeed}
                  disabled={isLoading}
                  className='gap-1'
                >
                  {isLoading ? (
                    <Icons.refresh className='h-4 w-4 animate-spin' />
                  ) : (
                    <Icons.seed className='h-4 w-4' />
                  )}
                  {isLoading ? 'Seeding...' : 'Seed Message Permissions'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
