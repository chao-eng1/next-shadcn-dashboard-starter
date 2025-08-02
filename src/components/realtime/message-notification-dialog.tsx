'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  MessageSquare, 
  Globe, 
  Users, 
  X, 
  ExternalLink,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  title: string;
  content: string;
  isGlobal: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
}

interface MessageNotificationDialogProps {
  message: Message;
  isOpen: boolean;
  onClose: () => void;
  onView: () => void;
}

export function MessageNotificationDialog({
  message,
  isOpen,
  onClose,
  onView
}: MessageNotificationDialogProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 延迟显示动画
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  // 自动关闭功能（10秒后）
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageTypeInfo = () => {
    if (message.isGlobal) {
      return {
        icon: <Globe className="h-4 w-4" />,
        text: '全体消息',
        variant: 'default' as const,
        color: 'text-blue-600'
      };
    }
    
    return {
      icon: <Users className="h-4 w-4" />,
      text: '定向消息',
      variant: 'secondary' as const,
      color: 'text-purple-600'
    };
  };

  const typeInfo = getMessageTypeInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "max-w-md mx-auto transform transition-all duration-300 ease-out",
          "bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-950/30",
          "border-2 shadow-2xl",
          isVisible 
            ? "scale-100 opacity-100 translate-y-0" 
            : "scale-95 opacity-0 translate-y-2"
        )}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,248,255,0.95) 100%)',
        }}
      >
        {/* 头部区域 */}
        <DialogHeader className="space-y-3 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Bell className="h-5 w-5 text-white animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-bounce">
                  <span className="sr-only">新消息</span>
                </div>
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                  新消息通知
                </DialogTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  刚刚收到
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* 消息内容区域 */}
        <div className="space-y-4 py-4">
          {/* 消息标题和类型 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-1">
                {message.title}
              </h3>
              <Badge 
                variant={typeInfo.variant} 
                className="flex items-center gap-1 shrink-0 ml-2"
              >
                {typeInfo.icon}
                {typeInfo.text}
              </Badge>
            </div>
          </div>

          <Separator className="opacity-30" />

          {/* 发送者信息 */}
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={message.sender.email} />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-sm">
                {message.sender.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {message.sender.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {message.sender.email}
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              {formatTime(message.createdAt)}
            </div>
          </div>

          {/* 消息内容预览 */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <DialogDescription className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
              {message.content}
            </DialogDescription>
          </div>
        </div>

        {/* 底部操作按钮 */}
        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="w-full sm:w-auto"
          >
            稍后查看
          </Button>
          <Button 
            onClick={onView} 
            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            立即查看
          </Button>
        </DialogFooter>

        {/* 自动关闭进度条 */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-b-lg"
            style={{
              animation: 'countdown 10s linear forwards'
            }}
          />
        </div>
      </DialogContent>

      <style jsx>{`
        @keyframes countdown {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </Dialog>
  );
}