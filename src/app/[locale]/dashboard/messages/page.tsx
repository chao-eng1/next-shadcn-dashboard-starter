'use client';

import { Suspense } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import PageContainer from '@/components/layout/page-container';
import { MessagesList } from '@/features/messages/components/messages-list';
import { IconMailbox, IconSettings } from '@tabler/icons-react';
import Link from 'next/link';
import { PermissionGate } from '@/components/permission-gate';

export default function MessagesPage() {
  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-7xl flex-1 flex-col space-y-6 px-4 md:px-6 lg:px-8'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Messages'
            description='View and manage your messages'
            icon={<IconMailbox className='text-muted-foreground h-6 w-6' />}
          />

          <PermissionGate role='admin'>
            <div className='flex gap-2'>
              <Button variant='outline' size='sm' asChild>
                <Link href='/system-management/permissions/seed-message'>
                  <IconSettings className='mr-2 h-4 w-4' />
                  初始化消息权限
                </Link>
              </Button>
            </div>
          </PermissionGate>
        </div>
        <Separator />

        <Card className='shadow-sm'>
          <CardHeader className='flex flex-row items-center justify-between pb-6'>
            <div className='space-y-1.5'>
              <CardTitle className='flex items-center gap-2 text-2xl'>
                <IconMailbox className='h-6 w-6' />
                <span>Your Messages</span>
              </CardTitle>
              <CardDescription>
                All messages sent to you from administrators and the system.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className='px-6 py-6'>
            <Suspense fallback={<div>Loading messages...</div>}>
              <MessagesList />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
