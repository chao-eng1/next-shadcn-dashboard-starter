'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCheck, Clock, AlertCircle, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/chat-store';
import { Message, MessageListProps } from '@/types/chat';

const MessageItem: React.FC<{ message: Message; isLast: boolean }> = ({
  message,
  isLast
}) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock size={12} className='text-gray-400' />;
      case 'sent':
        return <Check size={12} className='text-gray-500' />;
      case 'delivered':
        return <CheckCheck size={12} className='text-blue-500' />;
      case 'failed':
        return <AlertCircle size={12} className='text-red-500' />;
      default:
        return null;
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp);
  };

  return (
    <motion.div
      className={cn(
        'mb-4 flex w-full',
        isUser ? 'justify-end' : 'justify-start'
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <div
        className={cn(
          'flex max-w-[80%] space-x-2',
          isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
        )}
      >
        {/* 头像 */}
        <div
          className={cn(
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
            isUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          )}
        >
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* 消息内容 */}
        <div
          className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}
        >
          <div
            className={cn(
              'max-w-full rounded-lg px-4 py-2 break-words',
              isUser
                ? 'rounded-br-sm bg-blue-600 text-white'
                : 'rounded-bl-sm bg-gray-100 text-gray-900'
            )}
          >
            <div className='whitespace-pre-wrap'>{message.content}</div>

            {/* 附件 */}
            {message.attachments && message.attachments.length > 0 && (
              <div className='mt-2 space-y-1'>
                {message.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className='bg-opacity-20 flex items-center space-x-2 rounded bg-white p-2 text-sm'
                  >
                    <span>{attachment.name}</span>
                    <span className='text-xs opacity-75'>
                      ({attachment.size})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 时间和状态 */}
          <div
            className={cn(
              'mt-1 flex items-center space-x-1 text-xs text-gray-500',
              isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
            )}
          >
            <span>{formatTime(message.timestamp)}</span>
            {isUser && getStatusIcon()}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const MessageList: React.FC<MessageListProps> = ({
  className,
  conversationId,
  autoScroll = true
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, currentConversationId } = useChatStore();

  const targetConversationId = conversationId || currentConversationId;
  const conversationMessages = targetConversationId
    ? messages[targetConversationId] || []
    : [];

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      const scrollElement = scrollRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [conversationMessages, autoScroll]);

  if (!targetConversationId) {
    return (
      <div
        className={cn('flex flex-1 items-center justify-center p-8', className)}
      >
        <div className='text-center text-gray-500'>
          <Bot size={48} className='mx-auto mb-4 text-gray-300' />
          <h3 className='mb-2 text-lg font-medium'>欢迎使用AI助手</h3>
          <p className='text-sm'>开始新的对话，我将竭诚为您服务</p>
        </div>
      </div>
    );
  }

  if (conversationMessages.length === 0) {
    return (
      <div
        className={cn('flex flex-1 items-center justify-center p-8', className)}
      >
        <div className='text-center text-gray-500'>
          <Bot size={48} className='mx-auto mb-4 text-gray-300' />
          <h3 className='mb-2 text-lg font-medium'>开始对话</h3>
          <p className='text-sm'>发送第一条消息开始与AI助手的对话</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex-1 overflow-hidden', className)}>
      <div
        ref={scrollRef}
        className='h-full space-y-2 overflow-y-auto px-4 py-4'
      >
        <AnimatePresence mode='popLayout'>
          {conversationMessages.map((message, index) => (
            <MessageItem
              key={message.id}
              message={message}
              isLast={index === conversationMessages.length - 1}
            />
          ))}
        </AnimatePresence>

        {/* 底部间距 */}
        <div className='h-4' />
      </div>
    </div>
  );
};
