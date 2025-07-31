'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';

type Message = {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    email: string;
  };
};

export function MessageNotification() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [open, setOpen] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/messages/unread-count');
      if (!response.ok) {
        console.error('Failed to fetch unread count:', response.statusText);
        return;
      }

      const text = await response.text();
      if (!text || text.trim() === '') {
        console.error('Empty response received from server');
        return;
      }

      try {
        const data = JSON.parse(text);
        if (typeof data.count === 'number') {
          setUnreadCount(data.count);
        } else {
          console.error('Invalid count data:', data);
        }
      } catch (parseError) {
        console.error(
          'Error parsing JSON response:',
          parseError,
          'Response text:',
          text
        );
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchRecentMessages = async () => {
    if (!open) return;

    try {
      setLoading(true);
      const response = await fetch('/api/messages?limit=5');
      if (!response.ok) {
        console.error('Failed to fetch messages:', response.statusText);
        toast.error('Failed to load messages');
        setMessages([]);
        return;
      }

      const text = await response.text();
      if (!text || text.trim() === '') {
        console.error('Empty response received from server');
        setMessages([]);
        return;
      }

      try {
        const data = JSON.parse(text);
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        } else {
          console.error('Invalid messages data:', data);
          setMessages([]);
        }
      } catch (parseError) {
        console.error(
          'Error parsing JSON response:',
          parseError,
          'Response text:',
          text
        );
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: 'PUT'
      });

      if (!response.ok) {
        throw new Error('Failed to mark message as read');
      }

      // Update the local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );

      // Decrease unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Refresh the page if we're on the messages page
      if (window.location.pathname.includes('/messages')) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      toast.error('Failed to mark message as read');
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Set up polling for unread count (every 30 seconds)
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) {
      fetchRecentMessages();
    }
  }, [open]);

  const handleViewAllMessages = () => {
    router.push('/dashboard/messages');
    setOpen(false);
  };

  const handleMessageClick = (messageId: string) => {
    if (!messages.find((msg) => msg.id === messageId)?.isRead) {
      markAsRead(messageId);
    }
    router.push(`/dashboard/messages/${messageId}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='icon' className='relative'>
          <Bell className='h-5 w-5' />
          {unreadCount > 0 && (
            <Badge
              variant='destructive'
              className='absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs'
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80 p-0' align='end'>
        <div className='p-3 font-medium'>
          <h3 className='text-lg'>Messages</h3>
          <p className='text-muted-foreground text-xs'>
            {unreadCount > 0
              ? `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`
              : 'No new messages'}
          </p>
        </div>
        <Separator />
        <ScrollArea className='h-[300px]'>
          {loading ? (
            <div className='flex h-20 items-center justify-center'>
              <p className='text-muted-foreground text-sm'>Loading...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className='flex h-20 items-center justify-center'>
              <p className='text-muted-foreground text-sm'>No messages found</p>
            </div>
          ) : (
            <div className='flex flex-col'>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`hover:bg-accent cursor-pointer p-3 ${
                    !message.isRead ? 'bg-accent/50' : ''
                  }`}
                  onClick={() => handleMessageClick(message.id)}
                >
                  <div className='flex items-start justify-between'>
                    <h4
                      className={`text-sm font-medium ${
                        !message.isRead ? 'font-semibold' : ''
                      }`}
                    >
                      {message.title}
                    </h4>
                    <span className='text-muted-foreground text-xs'>
                      {formatDistanceToNow(new Date(message.createdAt), {
                        addSuffix: true
                      })}
                    </span>
                  </div>
                  <p className='text-muted-foreground mt-1 line-clamp-2 text-xs'>
                    {message.content}
                  </p>
                  <div className='mt-2 flex items-center justify-between'>
                    <span className='text-xs'>
                      From: {message.sender.name || message.sender.email}
                    </span>
                    {!message.isRead && (
                      <Badge variant='default' className='h-5 text-[10px]'>
                        New
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <Separator />
        <div className='p-2'>
          <Button
            variant='outline'
            size='sm'
            className='w-full'
            onClick={handleViewAllMessages}
          >
            View all messages
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
