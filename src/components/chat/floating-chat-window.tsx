'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Maximize2, Minimize2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/store/chat-store';
import { useDraggable } from '@/hooks/use-draggable';
import { useResizable } from '@/hooks/use-resizable';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { FloatingChatWindowProps } from '@/types/chat';

export const FloatingChatWindow: React.FC<FloatingChatWindowProps> = ({
  className,
  initialPosition = { x: 20, y: 20 },
  initialSize = { width: 320, height: 450 }
}) => {
  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const {
    isVisible,
    isMaximized,
    windowPosition,
    windowSize,
    toggleVisibility,
    toggleMaximized,
    updateWindowPosition,
    updateWindowSize,
    createConversation,
    currentConversationId
  } = useChatStore();

  // 拖拽功能
  const { isDragging, position } = useDraggable({
    nodeRef: windowRef,
    handle: headerRef,
    disabled: isMaximized,
    initialPosition: windowPosition || initialPosition,
    onDrag: (pos) => updateWindowPosition(pos),
    bounds: 'viewport'
  });

  // 调整大小功能
  const { isResizing, size } = useResizable({
    nodeRef: windowRef,
    disabled: isMaximized,
    initialSize: windowSize || initialSize,
    minSize: { width: 280, height: 350 },
    maxSize: { width: 600, height: 500 },
    onResize: (size) => updateWindowSize(size)
  });

  // 创建默认对话
  useEffect(() => {
    if (isVisible && !currentConversationId) {
      createConversation('AI助手', 'assistant');
    }
  }, [isVisible, currentConversationId, createConversation]);

  const handleClose = () => {
    toggleVisibility();
  };

  const handleMaximize = () => {
    toggleMaximized();
  };

  const handleNewConversation = () => {
    createConversation('新对话');
  };

  const windowStyle = isMaximized
    ? {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh'
      }
    : {
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height
      };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* 背景遮罩 (仅在最大化时显示) */}
          {isMaximized && (
            <motion.div
              className='bg-opacity-50 fixed inset-0 z-40 bg-black'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />
          )}

          {/* 聊天窗口 */}
          <motion.div
            ref={windowRef}
            className={cn(
              'fixed z-50 flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl',
              isDragging && 'cursor-grabbing',
              isResizing && 'cursor-se-resize',
              isMaximized && 'rounded-none',
              className
            )}
            style={windowStyle}
            initial={{
              opacity: 0,
              scale: 0.8
            }}
            animate={{
              opacity: 1,
              scale: 1
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
              transition: { duration: 0.2 }
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30
            }}
          >
            {/* 标题栏 */}
            <div
              ref={headerRef}
              className={cn(
                'flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white',
                !isMaximized && 'cursor-grab active:cursor-grabbing'
              )}
            >
              <div className='flex items-center space-x-3'>
                <div className='h-3 w-3 animate-pulse rounded-full bg-green-400' />
                <h3 className='text-lg font-semibold'>AI助手</h3>
              </div>

              <div className='flex items-center space-x-1'>
                {/* 新建对话按钮 */}
                <Button
                  variant='ghost'
                  size='sm'
                  className='hover:bg-opacity-20 h-auto p-1 text-white hover:bg-white'
                  onClick={handleNewConversation}
                  title='新建对话'
                >
                  <Plus size={16} />
                </Button>

                {/* 最小化按钮 */}
                <Button
                  variant='ghost'
                  size='sm'
                  className='hover:bg-opacity-20 h-auto p-1 text-white hover:bg-white'
                  onClick={handleClose}
                >
                  <Minus size={16} />
                </Button>

                {/* 最大化/还原按钮 */}
                <Button
                  variant='ghost'
                  size='sm'
                  className='hover:bg-opacity-20 h-auto p-1 text-white hover:bg-white'
                  onClick={handleMaximize}
                >
                  {isMaximized ? (
                    <Minimize2 size={16} />
                  ) : (
                    <Maximize2 size={16} />
                  )}
                </Button>

                {/* 关闭按钮 */}
                <Button
                  variant='ghost'
                  size='sm'
                  className='hover:bg-opacity-80 h-auto p-1 text-white hover:bg-red-500'
                  onClick={handleClose}
                >
                  <X size={16} />
                </Button>
              </div>
            </div>

            {/* 消息列表 */}
            <MessageList className='flex-1' />

            {/* 输入区域 */}
            <MessageInput
              placeholder='输入消息...'
              onSend={(message) => {
                console.log('Message sent:', message);
              }}
            />

            {/* 调整大小手柄 */}
            {!isMaximized && (
              <div className='absolute right-0 bottom-0 h-4 w-4 cursor-se-resize opacity-50 transition-opacity hover:opacity-100'>
                <div className='absolute right-1 bottom-1 h-2 w-2 border-r-2 border-b-2 border-gray-400' />
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
