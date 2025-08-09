'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, Menu, Wifi, WifiOff, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/store/chat-store';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { MobileChatInterfaceProps } from '@/types/chat';

export const MobileChatInterface: React.FC<MobileChatInterfaceProps> = ({
  className,
  onClose,
  showSidebar = false
}) => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(showSidebar);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialHeight = useRef(window.innerHeight);

  const {
    isConnected,
    currentConversationId,
    conversations,
    createConversation,
    setCurrentConversation
  } = useChatStore();

  // 检测虚拟键盘
  useEffect(() => {
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialHeight.current - currentHeight;

      // 如果高度减少超过150px，认为是键盘打开
      setIsKeyboardOpen(heightDifference > 150);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 手势关闭
  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.y > 100 && info.velocity.y > 0) {
      onClose?.();
    }
  };

  // 创建默认对话
  useEffect(() => {
    if (!currentConversationId && conversations.length === 0) {
      createConversation('AI助手', 'assistant');
    }
  }, [currentConversationId, conversations.length, createConversation]);

  return (
    <motion.div
      ref={containerRef}
      className={cn('fixed inset-0 z-50 flex flex-col bg-white', className)}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      drag='y'
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
    >
      {/* 拖拽指示器 */}
      <div className='flex justify-center bg-gray-50 py-2'>
        <div className='h-1 w-12 rounded-full bg-gray-300' />
      </div>

      {/* 标题栏 */}
      <div className='flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white'>
        <div className='flex items-center space-x-3'>
          {/* 侧边栏切换按钮 */}
          <Button
            variant='ghost'
            size='sm'
            className='hover:bg-opacity-20 h-auto p-1 text-white hover:bg-white'
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={20} />
          </Button>

          <div className='flex items-center space-x-2'>
            <div
              className={cn(
                'h-3 w-3 rounded-full',
                isConnected ? 'animate-pulse bg-green-400' : 'bg-red-400'
              )}
            />
            <h1 className='text-lg font-semibold'>AI助手</h1>
            {isConnected ? (
              <Wifi size={16} className='text-green-300' />
            ) : (
              <WifiOff size={16} className='text-red-300' />
            )}
          </div>
        </div>

        <div className='flex items-center space-x-2'>
          <Button
            variant='ghost'
            size='sm'
            className='hover:bg-opacity-20 h-auto p-1 text-white hover:bg-white'
          >
            <Settings size={18} />
          </Button>

          <Button
            variant='ghost'
            size='sm'
            className='hover:bg-opacity-80 h-auto p-1 text-white hover:bg-red-500'
            onClick={onClose}
          >
            <X size={20} />
          </Button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className='flex flex-1 overflow-hidden'>
        {/* 侧边栏 */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              className='flex w-64 flex-col border-r border-gray-200 bg-gray-50'
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className='border-b border-gray-200 p-4'>
                <h2 className='font-semibold text-gray-900'>对话历史</h2>
              </div>

              <div className='flex-1 overflow-y-auto p-2'>
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    className={cn(
                      'mb-2 w-full rounded-lg p-3 text-left transition-colors',
                      conversation.id === currentConversationId
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                    onClick={() => {
                      setCurrentConversation(conversation.id);
                      setSidebarOpen(false);
                    }}
                  >
                    <div className='truncate font-medium'>
                      {conversation.title}
                    </div>
                    <div className='mt-1 text-xs text-gray-500'>
                      {new Intl.DateTimeFormat('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }).format(conversation.updatedAt)}
                    </div>
                  </button>
                ))}
              </div>

              <div className='border-t border-gray-200 p-4'>
                <Button
                  className='w-full'
                  onClick={() => {
                    createConversation('新对话', 'assistant');
                    setSidebarOpen(false);
                  }}
                >
                  新建对话
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 聊天区域 */}
        <div className='flex flex-1 flex-col'>
          {/* 消息列表 */}
          <div
            className={cn(
              'flex-1 overflow-hidden',
              isKeyboardOpen && 'max-h-[40vh]'
            )}
          >
            <MessageList />
          </div>

          {/* 输入区域 */}
          <div
            className={cn(
              'transition-all duration-300',
              isKeyboardOpen && 'pb-safe-area-inset-bottom'
            )}
          >
            <MessageInput
              placeholder='输入消息...'
              onSend={(message) => {
                console.log('Mobile message sent:', message);
              }}
            />
          </div>
        </div>
      </div>

      {/* 侧边栏遮罩 */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className='bg-opacity-50 absolute inset-0 z-10 bg-black'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
