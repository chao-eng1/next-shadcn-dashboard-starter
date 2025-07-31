'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IconArrowLeft, IconCheck } from '@tabler/icons-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type MessageDetailProps = {
  messageId: string;
};

type Message = {
  id: string;
  title: string;
  content: string;
  isGlobal: boolean;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

export function MessageDetail({ messageId }: MessageDetailProps) {
  const router = useRouter();
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState(false);

  useEffect(() => {
    async function fetchMessage() {
      try {
        setLoading(true);
        const response = await fetch(`/api/messages/${messageId}`);

        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Message not found');
            router.push('/dashboard/messages');
            return;
          }
          throw new Error('Failed to fetch message');
        }

        const data = await response.json();
        setMessage(data);

        // If message is not read, mark it as read automatically
        if (data && !data.isRead) {
          markAsRead();
        }
      } catch (error) {
        console.error('Error fetching message:', error);
        toast.error('Failed to load message');
      } finally {
        setLoading(false);
      }
    }

    fetchMessage();
  }, [messageId, router]);

  const markAsRead = async () => {
    if (!message || message.isRead || markingAsRead) return;

    try {
      setMarkingAsRead(true);
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: 'PUT'
      });

      if (!response.ok) {
        throw new Error('Failed to mark message as read');
      }

      setMessage((prev) =>
        prev
          ? { ...prev, isRead: true, readAt: new Date().toISOString() }
          : null
      );
      router.refresh();
    } catch (error) {
      console.error('Error marking message as read:', error);
      toast.error('Failed to mark message as read');
    } finally {
      setMarkingAsRead(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/messages');
  };

  if (loading) {
    return (
      <Card className='w-full'>
        <CardContent className='flex h-64 items-center justify-center'>
          <div className='flex flex-col items-center gap-2'>
            <div className='border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent'></div>
            <p className='text-muted-foreground'>加载中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!message) {
    return (
      <Card className='w-full'>
        <CardContent className='flex h-64 items-center justify-center'>
          <p className='text-muted-foreground'>消息未找到</p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleBack} variant='outline'>
            <IconArrowLeft className='mr-2 h-4 w-4' />
            返回消息列表
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className='border-muted/20 w-full rounded-xl shadow-sm'>
      <CardHeader className='flex flex-col space-y-3 pb-6 md:flex-row md:items-center md:justify-between md:space-y-0'>
        <CardTitle className='text-2xl font-bold'>{message.title}</CardTitle>
        <div className='flex items-center space-x-2'>
          {message.isRead ? (
            <Badge variant='outline' className='bg-muted px-3 py-1'>
              Read{' '}
              {message.readAt &&
                `on ${format(new Date(message.readAt), 'MMM d, yyyy h:mm a')}`}
            </Badge>
          ) : (
            <Badge className='px-3 py-1'>New</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className='space-y-8 px-6 md:px-8'>
        <div className='bg-muted/30 flex items-center space-x-4 rounded-lg p-4'>
          <Avatar className='border-background h-12 w-12 border-2'>
            <AvatarImage
              src={message.sender.image || ''}
              alt={message.sender.name || 'Sender'}
            />
            <AvatarFallback className='bg-primary/10 text-primary'>
              {message.sender.name ? message.sender.name[0].toUpperCase() : 'S'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className='text-lg font-medium'>
              {message.sender.name || 'Anonymous'}
            </p>
            <p className='text-muted-foreground text-sm'>
              {message.sender.email}
            </p>
          </div>
          <div className='text-muted-foreground bg-background ml-auto rounded-md px-3 py-1 text-sm'>
            {format(new Date(message.createdAt), 'MMM d, yyyy h:mm a')}
          </div>
        </div>

        <div className='border-t pt-6'>
          <div className='prose dark:prose-invert max-w-none px-2 text-lg'>
            <p>{message.content}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className='mt-8 flex justify-between border-t px-6 py-6 md:px-8'>
        <Button
          onClick={handleBack}
          variant='outline'
          size='lg'
          className='gap-2'
        >
          <IconArrowLeft className='h-4 w-4' />
          返回消息列表
        </Button>

        {!message.isRead && (
          <Button
            onClick={markAsRead}
            disabled={markingAsRead}
            size='lg'
            className='gap-2'
          >
            <IconCheck className='h-4 w-4' />
            {markingAsRead ? '标记中...' : '标记为已读'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
