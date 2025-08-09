'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RobotIcon } from './robot-icon';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/chat-store';
import { FloatingChatTriggerProps } from '@/types/chat';
import { useFloatingDrag } from '@/hooks/use-floating-drag';

export const FloatingChatTrigger: React.FC<FloatingChatTriggerProps> = ({
  className,
  size = 'default',
  draggable = true,
  snapToEdge = true,
  onPositionChange
}) => {
  const {
    isVisible,
    unreadCount,
    toggleVisibility,
    triggerPosition,
    updateTriggerPosition
  } = useChatStore();

  const sizeClasses = {
    small: 'w-24 h-24',
    default: 'w-28 h-28',
    large: 'w-32 h-32'
  };

  const iconSizes = {
    small: 40,
    default: 48,
    large: 56
  };

  const {
    dragRef,
    position,
    isDragging,
    isMouseDown,
    hasDragged,
    isSnappedToEdge,
    snappedSide,
    handleMouseDown,
    updatePosition
  } = useFloatingDrag({
    initialPosition: triggerPosition,
    onPositionChange: (pos) => {
      updateTriggerPosition(pos);
      onPositionChange?.(pos);
    },
    snapToEdge,
    snapThreshold: 50,
    disabled: !draggable
  });

  // 同步store中的位置
  useEffect(() => {
    updatePosition(triggerPosition);
  }, [triggerPosition, updatePosition]);

  const handleClick = (e: React.MouseEvent) => {
    // 如果发生了拖拽，不触发点击事件
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    toggleVisibility();
  };

  return (
    <motion.div
      ref={dragRef}
      className={cn(
        'fixed z-50',
        isDragging ? 'cursor-grabbing' : 'cursor-grab',
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        userSelect: 'none'
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: isDragging ? 1.1 : isSnappedToEdge ? 0.9 : 1,
        opacity: 1
      }}
      whileHover={!isDragging ? { scale: 1.1 } : {}}
      whileTap={!isDragging ? { scale: 0.95 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={handleClick}
      onMouseDown={draggable ? handleMouseDown : undefined}
    >
      <div
        className={cn(
          'relative flex items-center justify-center',
          sizeClasses[size]
        )}
      >
        <RobotIcon
          size={iconSizes[size]}
          isSnappedToEdge={isSnappedToEdge}
          isDragging={isDragging}
          snappedSide={snappedSide}
        />

        {/* 未读消息计数 */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              className='absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white'
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 悬浮提示 */}
      <div className='pointer-events-none absolute right-0 bottom-full mb-2 rounded bg-gray-800 px-2 py-1 text-sm whitespace-nowrap text-white opacity-0 transition-opacity hover:opacity-100'>
        {isVisible ? '关闭对话' : '打开AI助手'}
      </div>
    </motion.div>
  );
};
