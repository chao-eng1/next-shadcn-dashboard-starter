import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PrismaClient } from '@prisma/client';
import { MessagesList } from '@/features/messages/components/messages-list';
import { IconPlus, IconMailbox } from '@tabler/icons-react';

async function getMessages() {
  const prisma = new PrismaClient();

  try {
    // Get messages with sender information
    const messages = await prisma.message.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        recipients: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      take: 10 // Limit to 10 most recent messages for initial load
    });

    const total = await prisma.message.count();

    return {
      messages: messages.map((message) => ({
        ...message,
        isRead: true // Admin view always shows messages as read
      })),
      pagination: {
        total,
        pages: Math.ceil(total / 10),
        page: 1,
        limit: 10
      }
    };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return {
      messages: [],
      pagination: {
        total: 0,
        pages: 0,
        page: 1,
        limit: 10
      }
    };
  } finally {
    await prisma.$disconnect();
  }
}

export default async function MessagesPage() {
  const { messages, pagination } = await getMessages();

  return (
    <div className='container mx-auto py-6'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Message Management</h1>
          <p className='text-muted-foreground'>
            Send and manage system messages to users
          </p>
        </div>
        <Button asChild>
          <Link href='/system-management/messages/send'>
            <IconPlus className='mr-2 h-4 w-4' />
            Send New Message
          </Link>
        </Button>
      </div>

      <div className='space-y-4'>
        <h2 className='flex items-center gap-2 text-xl font-semibold'>
          <IconMailbox className='h-5 w-5' />
          Message History
        </h2>

        <MessagesList
          initialMessages={messages}
          initialPagination={pagination}
        />
      </div>
    </div>
  );
}
