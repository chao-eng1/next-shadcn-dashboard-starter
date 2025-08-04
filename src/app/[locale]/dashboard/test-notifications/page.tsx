'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useUnreadMessages } from '@/hooks/use-unread-messages';
import { useRealtime } from '@/components/realtime/realtime-provider';
import { getWebSocketService } from '@/lib/websocket-service';
import { toast } from 'sonner';
import { MessageSquare, Send, Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function TestNotificationsPage() {
  const [testMessage, setTestMessage] = useState('');
  const [testTitle, setTestTitle] = useState('测试消息');
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const { unreadCount, fetchUnreadCount } = useUnreadMessages();
  const { isPolling, lastPolled } = useRealtime();

  // 使用useEffect来检查连接状态，避免在渲染过程中调用setState
  useEffect(() => {
    const checkConnection = () => {
      const wsService = getWebSocketService();
      setIsConnected(wsService.isConnected);
    };

    checkConnection();

    // 定期检查连接状态
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, []);

  const refreshConnectionStatus = () => {
    const wsService = getWebSocketService();
    setIsConnected(wsService.isConnected);
    fetchUnreadCount();
  };

  const sendTestMessage = () => {
    if (!testMessage.trim()) {
      toast.error('请输入测试消息内容');
      return;
    }

    // 模拟接收新消息事件
    const messageEvent = new CustomEvent('unreadCountUpdate', {
      detail: {
        conversationId: 'test-conversation',
        increment: 1,
        isOnMessagePage: false,
        message: {
          id: `test-${Date.now()}`,
          title: testTitle,
          content: testMessage,
          sender: {
            id: 'test-sender',
            name: '测试发送者',
            avatar: '/favicon.ico'
          },
          timestamp: new Date(),
          conversationName: '测试会话',
          isGlobal: false,
          createdAt: new Date().toISOString()
        }
      }
    });

    console.log('发送测试消息事件:', messageEvent.detail);
    window.dispatchEvent(messageEvent);

    // 也触发newMessage事件
    const newMessageEvent = new CustomEvent('newMessage', messageEvent);
    window.dispatchEvent(newMessageEvent);

    toast.success('测试消息已发送！');
    setTestMessage('');
  };

  const simulateRealTimeMessage = async () => {
    if (!user) {
      toast.error('用户未登录');
      return;
    }

    try {
      // 发送一个真实的系统消息
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: testTitle,
          content: testMessage || '这是一条通过API发送的测试消息',
          isGlobal: false,
          priority: 'medium',
          recipientIds: [user.id], // 发送给当前用户
          includeSender: false
        })
      });

      if (response.ok) {
        toast.success('API系统消息已发送！应该能收到实时通知');
        // 刷新未读计数
        setTimeout(() => {
          fetchUnreadCount();
        }, 1000);
      } else {
        const errorData = await response.json();
        console.error('API error:', errorData);
        toast.error('发送API消息失败: ' + (errorData.error || '未知错误'));
      }
    } catch (error) {
      console.error('发送API消息错误:', error);
      toast.error('发送API消息时出错');
    }
  };

  return (
    <div className='container mx-auto space-y-6 p-6'>
      <div className='flex items-center gap-3'>
        <MessageSquare className='h-6 w-6' />
        <h1 className='text-2xl font-bold'>消息通知测试页面</h1>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        {/* 连接状态卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              {isConnected ? (
                <Wifi className='h-5 w-5 text-green-500' />
              ) : (
                <WifiOff className='h-5 w-5 text-red-500' />
              )}
              连接状态
            </CardTitle>
            <CardDescription>实时消息系统连接状态</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <span>WebSocket连接:</span>
              <Badge variant={isConnected ? 'default' : 'destructive'}>
                {isConnected ? '已连接' : '未连接'}
              </Badge>
            </div>
            <div className='flex items-center justify-between'>
              <span>当前用户:</span>
              <span className='text-muted-foreground text-sm'>
                {user?.name || '未登录'}
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <span>未读消息数:</span>
              <Badge variant='outline'>{unreadCount}</Badge>
            </div>
            <div className='flex items-center justify-between'>
              <span>轮询状态:</span>
              <div className='flex items-center gap-2'>
                <RefreshCw
                  className={`h-3 w-3 ${isPolling ? 'animate-spin text-green-500' : 'text-gray-400'}`}
                />
                <Badge variant={isPolling ? 'default' : 'secondary'}>
                  {isPolling ? '运行中' : '已停止'}
                </Badge>
              </div>
            </div>
            {lastPolled && (
              <div className='flex items-center justify-between'>
                <span>上次检查:</span>
                <span className='text-muted-foreground text-sm'>
                  {lastPolled.toLocaleTimeString()}
                </span>
              </div>
            )}
            <Button
              onClick={refreshConnectionStatus}
              variant='outline'
              className='w-full'
            >
              刷新状态
            </Button>
          </CardContent>
        </Card>

        {/* 消息测试卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Send className='h-5 w-5' />
              发送测试消息
            </CardTitle>
            <CardDescription>测试跨页面消息通知功能</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='title'>消息标题</Label>
              <Input
                id='title'
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                placeholder='输入消息标题'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='message'>消息内容</Label>
              <Textarea
                id='message'
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder='输入测试消息内容...'
                rows={3}
              />
            </div>
            <div className='space-y-2'>
              <Button
                onClick={sendTestMessage}
                className='w-full'
                variant='default'
              >
                发送模拟消息
              </Button>
              <Button
                onClick={simulateRealTimeMessage}
                className='w-full'
                variant='outline'
              >
                发送API消息
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 说明卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>测试说明</CardTitle>
        </CardHeader>
        <CardContent className='text-muted-foreground space-y-2 text-sm'>
          <p>
            • <strong>模拟消息</strong>: 直接触发前端事件，测试事件监听机制
          </p>
          <p>
            • <strong>API消息</strong>: 通过真实API发送消息，测试完整流程
          </p>
          <p>
            • <strong>轮询机制</strong>: 每20秒自动检查未读消息，页面隐藏时暂停
          </p>
          <p>• 在此页面发送测试消息后，应该能看到:</p>
          <ul className='ml-4 list-disc space-y-1'>
            <li>右上角铃铛图标会显示动画并更新未读数量</li>
            <li>收到浏览器原生通知（需要授权）</li>
            <li>显示toast通知</li>
            <li>全局未读消息计数更新</li>
            <li>轮询状态实时更新，显示上次检查时间</li>
          </ul>
          <p>• 切换到其他页面（如首页、项目管理等）也应该能收到同样的通知</p>
          <p>
            • 由于WebSocket连接不稳定，系统会自动回退到轮询模式确保消息及时性
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
