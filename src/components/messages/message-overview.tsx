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
      <div className="h-full flex flex-col bg-muted/30">
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {selectedConversation.type === 'private' && <MessageSquare className="h-6 w-6 text-primary" />}
                  {selectedConversation.type === 'group' && <Users className="h-6 w-6 text-primary" />}
                  {selectedConversation.type === 'system' && <Bell className="h-6 w-6 text-primary" />}
                  {selectedConversation.type === 'project' && <Briefcase className="h-6 w-6 text-primary" />}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{selectedConversation.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.type === 'private' && '私人对话'}
                    {selectedConversation.type === 'group' && '群组聊天'}
                    {selectedConversation.type === 'system' && '系统消息'}
                    {selectedConversation.type === 'project' && '项目通知'}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedConversation.unreadCount > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">
                      {selectedConversation.unreadCount} 条未读消息
                    </Badge>
                  </div>
                )}
                
                {selectedConversation.lastMessage && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">最新消息</h4>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{selectedConversation.lastMessage.content}</p>
                      {selectedConversation.lastMessage.sender && (
                        <p className="text-xs text-muted-foreground mt-1">
                          来自 {selectedConversation.lastMessage.sender.name}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                <Button 
                  className="w-full"
                  onClick={() => {
                    switch (selectedConversation.type) {
                      case 'private':
                        router.push(`/dashboard/messages/private/${selectedConversation.id}`);
                        break;
                      case 'group':
                        router.push(`/dashboard/messages/group/${selectedConversation.id}`);
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
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/20 dark:via-background dark:to-purple-950/20">
      <div className="flex-1 p-6 space-y-6">
        {/* 欢迎信息 */}
        <div className="text-center space-y-4">
          <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <MessageSquare className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              欢迎使用消息中心
            </h2>
            <p className="text-muted-foreground mt-2">
              统一管理您的所有沟通渠道，提升团队协作效率
            </p>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', stat.bgColor)}>
                      <Icon className={cn('h-5 w-5', stat.color)} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
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
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              快速操作
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-accent"
                    onClick={action.onClick}
                  >
                    <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center text-white', action.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 设置入口 */}
        <Card>
          <CardContent className="p-4">
            <Button variant="outline" className="w-full" onClick={onNavigateToSettings}>
              <Settings className="h-4 w-4 mr-2" />
              消息设置
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}