'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  Send,
  Paperclip,
  Image,
  FileText,
  Smile,
  Mic,
  X,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message, MessageUser } from './message-bubble';

interface MessageInputProps {
  onSendMessage: (
    content: string,
    attachments?: File[],
    replyTo?: Message
  ) => void;
  onTyping?: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  replyTo?: Message;
  onCancelReply?: () => void;
  maxLength?: number;
  allowAttachments?: boolean;
  allowEmoji?: boolean;
  allowVoice?: boolean;
}

export function MessageInput({
  onSendMessage,
  onTyping,
  placeholder = '输入消息...',
  disabled = false,
  replyTo,
  onCancelReply,
  maxLength = 1000,
  allowAttachments = true,
  allowEmoji = true,
  allowVoice = true
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // 处理输入变化
  const handleInputChange = useCallback(
    (value: string) => {
      setMessage(value);

      // 处理打字状态
      if (onTyping) {
        if (!isTyping) {
          setIsTyping(true);
          onTyping(true);
        }

        // 清除之前的定时器
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // 设置新的定时器
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          onTyping(false);
        }, 1000);
      }
    },
    [isTyping, onTyping]
  );

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 发送消息
  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage && attachments.length === 0) return;

    onSendMessage(trimmedMessage, attachments, replyTo);
    setMessage('');
    setAttachments([]);

    // 清除打字状态
    if (isTyping && onTyping) {
      setIsTyping(false);
      onTyping(false);
    }

    // 重新聚焦输入框
    textareaRef.current?.focus();
  };

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);

    // 清空input以允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 移除附件
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 插入表情
  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage = message.slice(0, start) + emoji + message.slice(end);

    setMessage(newMessage);
    handleInputChange(newMessage);

    // 恢复光标位置
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
  };

  // 常用表情
  const commonEmojis = [
    '😀',
    '😂',
    '😍',
    '🤔',
    '👍',
    '👎',
    '❤️',
    '🎉',
    '😢',
    '😡',
    '🙏',
    '👏'
  ];

  return (
    <div className='bg-background border-t p-4'>
      {/* 回复消息预览 */}
      {replyTo && (
        <div className='bg-muted mb-3 flex items-start gap-3 rounded-lg p-3'>
          <div className='flex-1'>
            <p className='text-muted-foreground mb-1 text-xs font-medium'>
              回复 {replyTo.sender.name}
            </p>
            <p className='truncate text-sm'>{replyTo.content}</p>
          </div>
          <Button
            variant='ghost'
            size='sm'
            className='h-6 w-6 p-0'
            onClick={onCancelReply}
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      )}

      {/* 附件预览 */}
      {attachments.length > 0 && (
        <div className='mb-3 space-y-2'>
          {attachments.map((file, index) => (
            <div
              key={index}
              className='bg-muted flex items-center gap-3 rounded-lg p-2'
            >
              <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded'>
                {file.type.startsWith('image/') ? (
                  <Image className='text-primary h-4 w-4' />
                ) : (
                  <FileText className='text-primary h-4 w-4' />
                )}
              </div>
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-medium'>{file.name}</p>
                <p className='text-muted-foreground text-xs'>
                  {formatFileSize(file.size)}
                </p>
              </div>
              <Button
                variant='ghost'
                size='sm'
                className='h-6 w-6 p-0'
                onClick={() => removeAttachment(index)}
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 输入区域 */}
      <div className='flex items-end gap-2'>
        {/* 附件按钮 */}
        {allowAttachments && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='outline' size='sm' disabled={disabled}>
                        <Paperclip className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Image className='mr-2 h-4 w-4' />
                        图片
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FileText className='mr-2 h-4 w-4' />
                        文件
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <input
                    ref={fileInputRef}
                    type='file'
                    multiple
                    className='hidden'
                    onChange={handleFileSelect}
                    accept='image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar'
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>添加附件</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* 表情按钮 */}
        {allowEmoji && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' size='sm' disabled={disabled}>
                      <Smile className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className='w-64'>
                    <div className='grid grid-cols-6 gap-1 p-2'>
                      {commonEmojis.map((emoji, index) => (
                        <Button
                          key={index}
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0 text-lg'
                          onClick={() => insertEmoji(emoji)}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent>
                <p>添加表情</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* 输入框 */}
        <div className='relative flex-1'>
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'max-h-[120px] min-h-[40px] resize-none pr-12',
              message.length > maxLength && 'border-destructive'
            )}
            rows={1}
          />

          {/* 字数统计 */}
          <div className='text-muted-foreground absolute right-2 bottom-2 text-xs'>
            <span
              className={cn(message.length > maxLength && 'text-destructive')}
            >
              {message.length}/{maxLength}
            </span>
          </div>
        </div>

        {/* 语音按钮 */}
        {allowVoice && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isRecording ? 'destructive' : 'outline'}
                  size='sm'
                  disabled={disabled}
                  onClick={() => setIsRecording(!isRecording)}
                >
                  <Mic className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isRecording ? '停止录音' : '语音消息'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* 发送按钮 */}
        <Button
          onClick={handleSend}
          disabled={
            disabled ||
            (!message.trim() && attachments.length === 0) ||
            message.length > maxLength
          }
          size='sm'
        >
          <Send className='h-4 w-4' />
        </Button>
      </div>

      {/* 错误提示 */}
      {message.length > maxLength && (
        <div className='text-destructive mt-2 flex items-center gap-2 text-sm'>
          <AlertTriangle className='h-4 w-4' />
          消息长度超出限制
        </div>
      )}
    </div>
  );
}
