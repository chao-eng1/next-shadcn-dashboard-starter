'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Smile,
  Mic,
  Video,
  X,
  File,
  Reply,
  AtSign,
  Hash,
  Bold,
  Italic,
  Code,
  Link,
  Quote
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// 消息类型
export interface MessageDraft {
  content: string;
  type: 'text' | 'image' | 'file' | 'voice';
  attachments?: File[];
  replyTo?: {
    id: string;
    content: string;
    sender: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
  mentions?: {
    id: string;
    name: string;
    type: 'user' | 'channel';
  }[];
}

// 附件信息
interface AttachmentPreview {
  file: File;
  url: string;
  type: 'image' | 'file';
}

interface MessageInputProps {
  onSendMessage: (message: MessageDraft) => void;
  onTyping?: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  replyTo?: MessageDraft['replyTo'];
  onCancelReply?: () => void;
  allowAttachments?: boolean;
  allowVoice?: boolean;
  allowVideo?: boolean;
  maxLength?: number;
  participants?: {
    id: string;
    name: string;
    avatar?: string;
  }[];
  channels?: {
    id: string;
    name: string;
  }[];
  className?: string;
}

// 表情符号
const commonEmojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
  '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
  '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
  '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
  '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
  '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
  '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
  '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
  '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑',
  '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻'
];

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 检查文件类型
const isImageFile = (file: File) => {
  return file.type.startsWith('image/');
};

export function MessageInput({
  onSendMessage,
  onTyping,
  placeholder = '输入消息...',
  disabled = false,
  replyTo,
  onCancelReply,
  allowAttachments = true,
  allowVoice = true,
  allowVideo = false,
  maxLength = 2000,
  participants = [],
  channels = [],
  className
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [showEmojis, setShowEmojis] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mentions, setMentions] = useState<MessageDraft['mentions']>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // 处理输入变化
  const handleContentChange = useCallback((value: string) => {
    setContent(value);
    
    // 检查@提及
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@([^\s]*)$/);
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
      setCursorPosition(cursorPos);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
    
    // 触发输入状态
    if (onTyping) {
      onTyping(true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1000);
    }
  }, [onTyping]);

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    
    if (e.key === 'Escape') {
      if (showMentions) {
        setShowMentions(false);
      } else if (replyTo && onCancelReply) {
        onCancelReply();
      }
    }
  };

  // 发送消息
  const handleSend = () => {
    if (disabled) return;
    
    const trimmedContent = content.trim();
    if (!trimmedContent && attachments.length === 0) return;
    
    const message: MessageDraft = {
      content: trimmedContent,
      type: attachments.length > 0 ? (attachments[0].type === 'image' ? 'image' : 'file') : 'text',
      attachments: attachments.map(att => att.file),
      replyTo,
      mentions
    };
    
    onSendMessage(message);
    
    // 清空输入
    setContent('');
    setAttachments([]);
    setMentions([]);
    if (onCancelReply) onCancelReply();
    
    // 停止输入状态
    if (onTyping) onTyping(false);
    
    toast.success('消息已发送');
  };

  // 处理文件选择
  const handleFileSelect = (files: FileList | null, type: 'file' | 'image') => {
    if (!files || !allowAttachments) return;
    
    const newAttachments: AttachmentPreview[] = [];
    
    Array.from(files).forEach(file => {
      // 检查文件大小（限制为10MB）
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`文件 ${file.name} 超过10MB限制`);
        return;
      }
      
      const url = URL.createObjectURL(file);
      const attachmentType = type === 'image' || isImageFile(file) ? 'image' : 'file';
      
      newAttachments.push({
        file,
        url,
        type: attachmentType
      });
    });
    
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  // 移除附件
  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const newAttachments = [...prev];
      URL.revokeObjectURL(newAttachments[index].url);
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  // 插入表情
  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + emoji + content.substring(end);
    
    setContent(newContent);
    setShowEmojis(false);
    
    // 恢复光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  // 插入提及
  const insertMention = (participant: { id: string; name: string; type?: 'user' | 'channel' }) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const textBeforeCursor = content.substring(0, cursorPosition);
    const textAfterCursor = content.substring(cursorPosition);
    const mentionText = `@${participant.name} `;
    
    // 替换@查询文本
    const beforeMention = textBeforeCursor.replace(/@[^\s]*$/, '');
    const newContent = beforeMention + mentionText + textAfterCursor;
    
    setContent(newContent);
    setMentions(prev => [...(prev || []), {
      id: participant.id,
      name: participant.name,
      type: participant.type || 'user'
    }]);
    setShowMentions(false);
    
    // 恢复光标位置
    const newCursorPos = beforeMention.length + mentionText.length;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // 过滤提及候选
  const filteredParticipants = participants.filter(p => 
    p.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );
  
  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // 开始录音
  const startRecording = () => {
    if (!allowVoice) return;
    setIsRecording(true);
    // TODO: 实现录音功能
    toast.info('录音功能开发中...');
  };

  // 停止录音
  const stopRecording = () => {
    setIsRecording(false);
    // TODO: 实现录音功能
  };

  return (
    <div className={cn('border-t bg-background', className)}>
      {/* 回复预览 */}
      {replyTo && (
        <div className="p-3 border-b bg-muted/50">
          <div className="flex items-start gap-2">
            <Reply className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={replyTo.sender.avatar} alt={replyTo.sender.name} />
                  <AvatarFallback className="text-xs">{replyTo.sender.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{replyTo.sender.name}</span>
              </div>
              <p className="text-sm text-muted-foreground truncate">{replyTo.content}</p>
            </div>
            {onCancelReply && (
              <Button variant="ghost" size="sm" onClick={onCancelReply}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* 附件预览 */}
      {attachments.length > 0 && (
        <div className="p-3 border-b">
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div key={index} className="relative group">
                {attachment.type === 'image' ? (
                  <div className="relative">
                    <img
                      src={attachment.url}
                      alt={attachment.file.name}
                      className="h-20 w-20 object-cover rounded border"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 border rounded bg-muted">
                    <File className="h-6 w-6 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate max-w-32">{attachment.file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(attachment.file.size)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 提及建议 */}
      {showMentions && (filteredParticipants.length > 0 || filteredChannels.length > 0) && (
        <div className="border-b bg-background">
          <div className="max-h-40 overflow-y-auto p-2">
            {filteredParticipants.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground px-2 py-1">成员</p>
                {filteredParticipants.slice(0, 5).map(participant => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                    onClick={() => insertMention(participant)}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={participant.avatar} alt={participant.name} />
                      <AvatarFallback className="text-xs">{participant.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{participant.name}</span>
                  </div>
                ))}
              </div>
            )}
            
            {filteredChannels.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground px-2 py-1">频道</p>
                {filteredChannels.slice(0, 5).map(channel => (
                  <div
                    key={channel.id}
                    className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                    onClick={() => insertMention({ ...channel, type: 'channel' })}
                  >
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{channel.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 输入区域 */}
      <div className="p-4">
        <div className="flex items-end gap-2">
          {/* 附件按钮 */}
          {allowAttachments && (
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={disabled}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>附件</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={disabled}
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>图片</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          
          {/* 输入框 */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="min-h-[40px] max-h-32 resize-none pr-20"
              maxLength={maxLength}
            />
            
            {/* 字符计数 */}
            {content.length > maxLength * 0.8 && (
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {content.length}/{maxLength}
              </div>
            )}
          </div>
          
          {/* 表情按钮 */}
          <DropdownMenu open={showEmojis} onOpenChange={setShowEmojis}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={disabled}>
                <Smile className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-2">
              <div className="grid grid-cols-8 gap-1 max-h-60 overflow-y-auto">
                {commonEmojis.map((emoji, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-lg hover:bg-muted"
                    onClick={() => insertEmoji(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* 语音按钮 */}
          {allowVoice && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isRecording ? 'destructive' : 'ghost'}
                    size="sm"
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onMouseLeave={stopRecording}
                    disabled={disabled}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isRecording ? '松开结束录音' : '按住录音'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* 视频通话按钮 */}
          {allowVideo && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={disabled}>
                    <Video className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>视频通话</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* 发送按钮 */}
          <Button
            onClick={handleSend}
            disabled={disabled || (!content.trim() && attachments.length === 0)}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files, 'file')}
      />
      
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files, 'image')}
      />
    </div>
  );
}