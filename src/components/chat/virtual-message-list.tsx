'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { motion } from 'framer-motion';
import { Check, CheckCheck, Clock, AlertCircle, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/chat-store';
import { Message, VirtualMessageListProps } from '@/types/chat';

const MessageItem: React.FC<{
  index: number;
  style: React.CSSProperties;
  data: Message[];
}> = ({ index, style, data }) => {
  const message = data[index];
  const isUser = message.role === 'user';

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
    <div style={style} className='px-4'>
      <motion.div
        className={cn(
          'mb-4 flex w-full',
          isUser ? 'justify-end' : 'justify-start'
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
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
            className={cn(
              'flex flex-col',
              isUser ? 'items-end' : 'items-start'
            )}
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
    </div>
  );
};

export const VirtualMessageList: React.FC<VirtualMessageListProps> = ({
  className,
  conversationId,
  height = 400,
  itemHeight = 80,
  autoScroll = true,
  onLoadMore
}) => {
  const listRef = useRef<List>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const { messages, currentConversationId } = useChatStore();

  const targetConversationId = conversationId || currentConversationId;
  const conversationMessages = targetConversationId
    ? messages[targetConversationId] || []
    : [];

  // 自动滚动到底部
  useEffect(() => {
    if (
      autoScroll &&
      isScrolledToBottom &&
      listRef.current &&
      conversationMessages.length > 0
    ) {
      listRef.current.scrollToItem(conversationMessages.length - 1, 'end');
    }
  }, [conversationMessages, autoScroll, isScrolledToBottom]);

  // 处理滚动事件
  const handleScroll = useCallback(
    ({ scrollOffset, scrollUpdateWasRequested }: any) => {
      if (!scrollUpdateWasRequested) {
        const scrollHeight = conversationMessages.length * itemHeight;
        const isAtBottom = scrollOffset + height >= scrollHeight - 50;
        setIsScrolledToBottom(isAtBottom);

        // 检查是否需要加载更多
        if (scrollOffset === 0 && onLoadMore) {
          onLoadMore();
        }
      }
    },
    [conversationMessages.length, itemHeight, height, onLoadMore]
  );

  // 计算动态项目高度
  const getItemSize = useCallback(
    (index: number) => {
      const message = conversationMessages[index];
      if (!message) return itemHeight;

      // 基础高度
      let height = 60;

      // 根据内容长度调整高度
      const contentLines = Math.ceil(message.content.length / 50);
      height += contentLines * 20;

      // 附件高度
      if (message.attachments && message.attachments.length > 0) {
        height += message.attachments.length * 30;
      }

      return Math.max(height, itemHeight);
    },
    [conversationMessages, itemHeight]
  );

  if (!targetConversationId) {
    return (
      <div
        className={cn('flex items-center justify-center p-8', className)}
        style={{ height }}
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
        className={cn('flex items-center justify-center p-8', className)}
        style={{ height }}
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
    <div className={cn('relative', className)}>
      <List
        ref={listRef}
        height={height}
        itemCount={conversationMessages.length}
        itemSize={getItemSize}
        itemData={conversationMessages}
        onScroll={handleScroll}
        overscanCount={5}
      >
        {MessageItem}
      </List>

      {/* 滚动到底部按钮 */}
      {!isScrolledToBottom && (
        <motion.button
          className='absolute right-4 bottom-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-colors hover:bg-blue-700'
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          onClick={() => {
            if (listRef.current) {
              listRef.current.scrollToItem(
                conversationMessages.length - 1,
                'end'
              );
              setIsScrolledToBottom(true);
            }
          }}
        >
          ↓
        </motion.button>
      )}
    </div>
  );
};
