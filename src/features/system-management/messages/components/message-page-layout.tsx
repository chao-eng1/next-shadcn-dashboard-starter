'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { IconArrowLeft } from '@tabler/icons-react';
import { PermissionGate } from '@/components/permission-gate';

interface MessagePageLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  loading?: boolean;
  showBackToMessages?: boolean;
  showBackToManagement?: boolean;
  permission?: string;
  role?: string;
  actions?: React.ReactNode;
  previewData?: {
    title: string;
    content: string;
  };
}

export function MessagePageLayout({
  title,
  description,
  children,
  loading = false,
  showBackToMessages = true,
  showBackToManagement = false,
  permission,
  role,
  actions,
  previewData = { title: '', content: '' }
}: MessagePageLayoutProps) {
  const content = (
    <div className='mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8'>
      <Card className='bg-card text-card-foreground w-full rounded-xl border shadow-sm'>
        <CardHeader className='border-b pb-6'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-2xl font-bold'>{title}</CardTitle>
              <CardDescription className='mt-1'>{description}</CardDescription>
            </div>
            {showBackToMessages && (
              <Button
                variant='outline'
                size='sm'
                asChild
                className='hover:bg-primary/10 transition-all'
              >
                <Link href='/dashboard/messages'>
                  <IconArrowLeft className='mr-2 h-4 w-4' />
                  返回消息列表
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className='overflow-y-auto px-6 py-8 md:px-8'>
          {loading ? (
            <div className='flex h-64 items-center justify-center'>
              <div className='flex flex-col items-center gap-2'>
                <div className='border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent'></div>
                <p className='text-muted-foreground'>加载中...</p>
              </div>
            </div>
          ) : (
            <div className='grid grid-cols-1 gap-6 px-0 md:grid-cols-2 md:px-4'>
              <div className='flex flex-col space-y-4'>
                <div className='bg-muted/50 border-border rounded-lg border p-6'>
                  <h3 className='mb-2 text-lg font-medium'>消息发送指南</h3>
                  <div className='text-muted-foreground space-y-3 text-sm'>
                    <p>在右侧表单中填写您要发送的消息内容，并选择接收者。</p>
                    <div>
                      <p className='text-foreground font-medium'>
                        接收者选项：
                      </p>
                      <ul className='mt-1 list-inside list-disc space-y-1'>
                        <li>所有用户 - 消息将发送给系统中的所有用户</li>
                        <li>特定角色的用户 - 消息将发送给选定角色的所有用户</li>
                        <li>指定用户 - 消息将仅发送给您选择的用户</li>
                      </ul>
                    </div>
                    <p>消息发送后，接收者将在其消息中心看到新消息通知。</p>
                  </div>
                </div>

                <div className='bg-muted/50 border-border rounded-lg border p-6'>
                  <h3 className='mb-2 text-lg font-medium'>消息预览</h3>
                  <div className='bg-background rounded-md border p-4'>
                    <div className='text-sm font-medium'>标题预览</div>
                    {previewData.title ? (
                      <div className='mt-2 font-medium'>
                        {previewData.title}
                      </div>
                    ) : (
                      <div className='text-muted-foreground mt-1 text-xs italic'>
                        填写右侧表单后此处将显示预览
                      </div>
                    )}

                    {previewData.content && (
                      <>
                        <div className='mt-4 text-sm font-medium'>内容预览</div>
                        <div className='mt-2 text-sm'>
                          {previewData.content.length > 150
                            ? `${previewData.content.substring(0, 150)}...`
                            : previewData.content}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className=''>{children}</div>
            </div>
          )}
        </CardContent>
        {showBackToManagement && (
          <CardFooter className='flex justify-between border-t px-6 py-6 md:px-8'>
            <Button
              variant='outline'
              asChild
              className='hover:bg-primary/10 transition-all'
            >
              <Link href='/system-management/messages'>
                <IconArrowLeft className='mr-2 h-4 w-4' />
                返回消息管理
              </Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );

  if (permission || role) {
    return (
      <PermissionGate permission={permission} role={role}>
        {content}
      </PermissionGate>
    );
  }

  return content;
}
