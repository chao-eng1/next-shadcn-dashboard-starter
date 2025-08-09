'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChatStore } from '@/store/chat-store';
import { useWebSocketChat } from '@/hooks/use-websocket-chat';
import { MessageInputProps } from '@/types/chat';

export const MessageInput: React.FC<MessageInputProps> = ({
  className,
  placeholder = '输入消息...',
  maxLength = 1000,
  onSend,
  disabled = false
}) => {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { currentConversationId, addMessage, isTyping } = useChatStore();
  const { sendChatMessage, sendTypingIndicator } = useWebSocketChat();

  // 自动调整文本框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSend = async () => {
    if (!message.trim() || disabled || !currentConversationId) return;

    const messageContent = message.trim();
    setMessage('');

    // 添加用户消息到本地状态
    const userMessage = {
      id: Math.random().toString(36).substr(2, 9),
      content: messageContent,
      role: 'user' as const,
      timestamp: new Date(),
      conversationId: currentConversationId,
      status: 'sending' as const
    };

    addMessage(currentConversationId, userMessage);

    try {
      // 发送消息到服务器
      const success = sendChatMessage(currentConversationId, messageContent);

      if (success) {
        // 更新消息状态为已发送
        addMessage(currentConversationId, {
          ...userMessage,
          status: 'sent'
        });
      } else {
        // 发送失败，更新状态
        addMessage(currentConversationId, {
          ...userMessage,
          status: 'failed'
        });
      }

      // 调用外部回调
      onSend?.(messageContent);
    } catch (error) {
      console.error('Failed to send message:', error);
      addMessage(currentConversationId, {
        ...userMessage,
        status: 'failed'
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setMessage(value);

      // 发送打字指示器
      if (value.length > 0 && currentConversationId) {
        sendTypingIndicator(currentConversationId);
      }
    }
  };

  const canSend = message.trim().length > 0 && !disabled;

  return (
    <div
      className={cn('flex flex-col space-y-2 border-t bg-white p-4', className)}
    >
      {/* 打字指示器 */}
      {isTyping && (
        <motion.div
          className='flex items-center space-x-2 text-sm text-gray-500'
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className='flex space-x-1'>
            <div className='h-2 w-2 animate-bounce rounded-full bg-gray-400' />
            <div
              className='h-2 w-2 animate-bounce rounded-full bg-gray-400'
              style={{ animationDelay: '0.1s' }}
            />
            <div
              className='h-2 w-2 animate-bounce rounded-full bg-gray-400'
              style={{ animationDelay: '0.2s' }}
            />
          </div>
          <span>AI正在输入...</span>
        </motion.div>
      )}

      <div className='flex items-end space-x-2'>
        {/* 输入框 */}
        <div className='relative flex-1'>
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={placeholder}
            disabled={disabled}
            className='max-h-[120px] min-h-[40px] resize-none py-2'
            rows={1}
          />
        </div>

        {/* 发送按钮 */}
        <Button
          onClick={handleSend}
          disabled={!canSend}
          size='sm'
          className={cn(
            'h-auto flex-shrink-0 p-2 transition-all',
            canSend ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300'
          )}
        >
          <Send size={18} />
        </Button>
      </div>

      {/* 字符计数 */}
      <div className='flex items-center justify-between text-xs text-gray-500'>
        <div className='flex items-center space-x-2'>
          <span>按 Enter 发送，Shift + Enter 换行</span>
        </div>
        <span
          className={cn(
            message.length > maxLength * 0.9 ? 'text-red-500' : 'text-gray-400'
          )}
        >
          {message.length}/{maxLength}
        </span>
      </div>
    </div>
  );
};
