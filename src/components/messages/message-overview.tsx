'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Users,
  Bell,
  Briefcase,
  Settings,
  Plus,
  TrendingUp,
  Clock,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Conversation } from './conversation-list';

interface MessageOverviewProps {
  selectedConversation: Conversation | null;
  totalUnreadCount: number;
  onNavigateToSettings: () => void;
}

export function MessageOverview({
  selectedConversation,
  totalUnreadCount,
  onNavigateToSettings
}: MessageOverviewProps) {
  const router = useRouter();

  // 快速操作按钮
  const quickActions = [
    {
      title: '新建私聊',
      description: '开始一对一私密对话',
      icon: MessageSquare,
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => router.push('/dashboard/messages/private/new')
    },
    {
      title: '项目群聊',
      description: '查看项目团队讨论',
      icon: Users,
      color: 'bg-green-500 hover:bg-green-600',
      onClick: () => router.push('/dashboard/messages/group')
    },
    {
      title: '系统消息',
      description: '查看系统通知和公告',
      icon: Bell,
      color: 'bg-orange-500 hover:bg-orange-600',
      onClick: () => router.push('/dashboard/messages/system')
    },
    {
      title: '项目通知',
      description: '管理项目相关通知',
      icon: Briefcase,
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => router.push('/dashboard/messages/notifications')
    }
  ];

  // 统计信息
  const stats = [
    {
      title: '未读消息',
      value: totalUnreadCount,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: '活跃会话',
      value: 8,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: '今日消息',
      value: 24,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    },
    {
      title: '重要通知',
      value: 3,
      icon: Star,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    }
  ];

  if (selectedConversation) {
    // 如果选中了会话，显示会话详情预览
    return (
      <div className='bg-muted/30 flex h-full flex-col'>
        <div className='p-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-3'>
                <div className='bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full'>
                  {selectedConversation.type === 'private' && (
                    <MessageSquare className='text-primary h-6 w-6' />
                  )}
                  {selectedConversation.type === 'group' && (
                    <Users className='text-primary h-6 w-6' />
                  )}
                  {selectedConversation.type === 'system' && (
                    <Bell className='text-primary h-6 w-6' />
                  )}
                  {selectedConversation.type === 'project' && (
                    <Briefcase className='text-primary h-6 w-6' />
                  )}
                </div>
                <div>
                  <h2 className='text-xl font-semibold'>
                    {selectedConversation.name}
                  </h2>
                  <p className='text-muted-foreground text-sm'>
                    {selectedConversation.type === 'private' && '私人对话'}
                    {selectedConversation.type === 'group' && '群组聊天'}
                    {selectedConversation.type === 'system' && '系统消息'}
                    {selectedConversation.type === 'project' && '项目通知'}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {selectedConversation.unreadCount > 0 && (
                  <div className='flex items-center gap-2'>
                    <Badge variant='destructive'>
                      {selectedConversation.unreadCount} 条未读消息
                    </Badge>
                  </div>
                )}

                {selectedConversation.lastMessage && (
                  <div>
                    <h4 className='mb-2 text-sm font-medium'>最新消息</h4>
                    <div className='bg-muted rounded-lg p-3'>
                      <p className='text-sm'>
                        {selectedConversation.lastMessage.content}
                      </p>
                      {selectedConversation.lastMessage.sender && (
                        <p className='text-muted-foreground mt-1 text-xs'>
                          来自 {selectedConversation.lastMessage.sender.name}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  className='w-full'
                  onClick={() => {
                    switch (selectedConversation.type) {
                      case 'private':
                        router.push(
                          `/dashboard/messages/private/${selectedConversation.id}`
                        );
                        break;
                      case 'group':
                        router.push(
                          `/dashboard/messages/group/${selectedConversation.id}`
                        );
                        break;
                      case 'system':
                        router.push('/dashboard/messages/system');
                        break;
                      case 'project':
                        router.push('/dashboard/messages/notifications');
                        break;
                    }
                  }}
                >
                  进入会话
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 默认显示消息概览
  return (
    <div className='dark:via-background flex h-full flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20'>
      <div className='flex-1 space-y-6 p-6'>
        {/* 欢迎信息 */}
        <div className='space-y-4 text-center'>
          <div className='mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600'>
            <MessageSquare className='h-10 w-10 text-white' />
          </div>
          <div>
            <h2 className='bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent'>
              欢迎使用消息中心
            </h2>
            <p className='text-muted-foreground mt-2'>
              统一管理您的所有沟通渠道，提升团队协作效率
            </p>
          </div>
        </div>

        {/* 统计信息 */}
        <div className='grid grid-cols-2 gap-4'>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className='transition-shadow hover:shadow-md'>
                <CardContent className='p-4'>
                  <div className='flex items-center gap-3'>
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        stat.bgColor
                      )}
                    >
                      <Icon className={cn('h-5 w-5', stat.color)} />
                    </div>
                    <div>
                      <p className='text-2xl font-bold'>{stat.value}</p>
                      <p className='text-muted-foreground text-sm'>
                        {stat.title}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 快速操作 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Plus className='h-5 w-5' />
              快速操作
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 gap-3'>
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant='outline'
                    className='hover:bg-accent flex h-auto flex-col items-center gap-2 p-4'
                    onClick={action.onClick}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg text-white',
                        action.color
                      )}
                    >
                      <Icon className='h-4 w-4' />
                    </div>
                    <div className='text-center'>
                      <p className='text-sm font-medium'>{action.title}</p>
                      <p className='text-muted-foreground text-xs'>
                        {action.description}
                      </p>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 设置入口 */}
        <Card>
          <CardContent className='p-4'>
            <Button
              variant='outline'
              className='w-full'
              onClick={onNavigateToSettings}
            >
              <Settings className='mr-2 h-4 w-4' />
              消息设置
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
