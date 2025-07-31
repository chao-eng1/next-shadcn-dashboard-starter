'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Role, User } from '@prisma/client';
import { MessageForm } from '@/features/system-management/messages/components/message-form';
import { MessagePageLayout } from '@/features/system-management/messages/components/message-page-layout';
import { toast } from 'sonner';

import { ScrollArea } from '@/components/ui/scroll-area';
import {
  messageFormSchema,
  MessageFormValues
} from '@/features/system-management/messages/schemas/message-schema';

export default function SendMessagePage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewData, setPreviewData] = useState({ title: '', content: '' });

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);

        // Fetch roles
        // Fetch roles with detailed error handling
        const rolesResponse = await fetch('/api/system-management/roles');
        if (!rolesResponse.ok) {
          const errorText = await rolesResponse.text();
          console.error('Roles API error response:', errorText);
          throw new Error(
            `Failed to fetch roles: ${rolesResponse.status} ${rolesResponse.statusText}`
          );
        }
        const rolesData = await rolesResponse.json();
        console.log('Roles data received:', rolesData);
        console.log('Roles data type:', typeof rolesData);
        console.log('Is roles array?', Array.isArray(rolesData));
        if (Array.isArray(rolesData)) {
          console.log('Roles count:', rolesData.length);
        }

        // Fetch users with detailed error handling
        const usersResponse = await fetch('/api/system-management/users');
        if (!usersResponse.ok) {
          const errorText = await usersResponse.text();
          console.error('Users API error response:', errorText);
          throw new Error(
            `Failed to fetch users: ${usersResponse.status} ${usersResponse.statusText}`
          );
        }
        const usersData = await usersResponse.json();
        console.log('Users data received:', usersData);
        console.log('Users data type:', typeof usersData);
        console.log('Is users array?', Array.isArray(usersData));
        if (Array.isArray(usersData)) {
          console.log('Users count:', usersData.length);
        }

        // API returns an array directly, not wrapped in a roles/users object
        setRoles(Array.isArray(rolesData) ? rolesData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (error) {
        console.error('Error fetching data:', error);

        // Log more detailed information for debugging
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }

        // Show a more specific error message to the user
        toast.error('无法加载角色或用户数据，请检查网络连接和权限');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <ScrollArea className='h-[calc(100dvh-52px)]'>
      <div className='flex-1 p-4 md:p-6'>
        <MessagePageLayout
          title='发送系统消息'
          description='向平台用户发送系统消息'
          loading={isLoading}
          showBackToMessages={true}
          showBackToManagement={true}
          permission='message:manage'
          role='admin'
          previewData={previewData}
        >
          <MessageForm
            roles={roles}
            users={users}
            onSuccess={() => router.push('/dashboard/messages')}
            onFormChange={(values) => {
              // Only update the state when values actually change to avoid loops
              const newTitle = values.title || '';
              const newContent = values.content || '';

              if (
                previewData.title !== newTitle ||
                previewData.content !== newContent
              ) {
                setPreviewData({
                  title: newTitle,
                  content: newContent
                });
              }
            }}
          />
        </MessagePageLayout>
      </div>
    </ScrollArea>
  );
}
