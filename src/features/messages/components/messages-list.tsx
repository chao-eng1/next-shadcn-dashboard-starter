'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  IconDots,
  IconEye,
  IconCircleCheck,
  IconEdit
} from '@tabler/icons-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

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
  };
};

type MessagesListProps = {
  initialMessages?: Message[];
  initialPagination?: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
};

export function MessagesList({
  initialMessages,
  initialPagination
}: MessagesListProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [loading, setLoading] = useState(!initialMessages);
  const [page, setPage] = useState(initialPagination?.page || 1);
  const [limit, setLimit] = useState(initialPagination?.limit || 10);
  const [total, setTotal] = useState(initialPagination?.total || 0);
  const [totalPages, setTotalPages] = useState(initialPagination?.pages || 0);
  const [filter, setFilter] = useState<'all' | 'read' | 'unread'>('all');

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/messages?page=${page}&limit=${limit}&status=${filter}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.messages);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialMessages) {
      fetchMessages();
    }
  }, [page, limit, filter, initialMessages]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: string) => {
    setLimit(parseInt(newLimit));
    setPage(1); // Reset to first page when changing limit
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter as 'all' | 'read' | 'unread');
    setPage(1); // Reset to first page when changing filter
  };

  const handleViewMessage = (messageId: string) => {
    router.push(`/dashboard/messages/${messageId}`);
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: 'PUT'
      });

      if (!response.ok) {
        throw new Error('Failed to mark message as read');
      }

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, isRead: true, readAt: new Date().toISOString() }
            : msg
        )
      );

      toast.success('Message marked as read');
      router.refresh();
    } catch (error) {
      console.error('Error marking message as read:', error);
      toast.error('Failed to mark message as read');
    }
  };

  return (
    <div className='space-y-6 p-1'>
      <div className='flex items-center justify-between px-1'>
        <div className='flex items-center gap-3'>
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className='w-36'>
              <SelectValue placeholder='Filter' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Messages</SelectItem>
              <SelectItem value='read'>Read</SelectItem>
              <SelectItem value='unread'>Unread</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='flex items-center gap-3'>
          <Select value={limit.toString()} onValueChange={handleLimitChange}>
            <SelectTrigger className='w-24'>
              <SelectValue placeholder='Limit' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='5'>5 / page</SelectItem>
              <SelectItem value='10'>10 / page</SelectItem>
              <SelectItem value='20'>20 / page</SelectItem>
              <SelectItem value='50'>50 / page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='overflow-hidden rounded-lg border shadow-sm'>
        <Table>
          <TableHeader>
            <TableRow className='bg-muted/50'>
              <TableHead className='w-[100px]'>Status</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className='w-[180px]'>Sender</TableHead>
              <TableHead className='w-[150px]'>Date</TableHead>
              <TableHead className='w-[80px] text-center'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className='h-24 text-center'>
                  <div className='flex items-center justify-center space-x-2'>
                    <div className='border-primary h-5 w-5 animate-spin rounded-full border-2 border-t-transparent'></div>
                    <span>加载中...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='h-24 text-center'>
                  <div className='text-muted-foreground'>没有找到消息</div>
                </TableCell>
              </TableRow>
            ) : (
              messages.map((message) => (
                <TableRow
                  key={message.id}
                  className={
                    !message.isRead
                      ? 'bg-accent/30 hover:bg-accent/40'
                      : 'hover:bg-muted/40'
                  }
                >
                  <TableCell>
                    {message.isRead ? (
                      <Badge variant='outline' className='bg-muted'>
                        Read
                      </Badge>
                    ) : (
                      <Badge>New</Badge>
                    )}
                  </TableCell>
                  <TableCell
                    className='cursor-pointer'
                    onClick={() => handleViewMessage(message.id)}
                  >
                    <div className='font-medium'>{message.title}</div>
                    <div className='text-muted-foreground line-clamp-1 text-sm'>
                      {message.content}
                    </div>
                  </TableCell>
                  <TableCell>
                    {message.sender.name || message.sender.email}
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(message.createdAt), {
                      addSuffix: true
                    })}
                  </TableCell>
                  <TableCell className='text-center'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' className='h-8 w-8 p-0'>
                          <span className='sr-only'>Open menu</span>
                          <IconDots className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuLabel>操作</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleViewMessage(message.id)}
                        >
                          <IconEye className='mr-2 h-4 w-4' />
                          查看
                        </DropdownMenuItem>
                        {!message.isRead && (
                          <DropdownMenuItem
                            onClick={() => handleMarkAsRead(message.id)}
                          >
                            <IconCircleCheck className='mr-2 h-4 w-4' />
                            标记为已读
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className='mt-8 flex justify-center'>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href='#'
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) handlePageChange(page - 1);
                  }}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>

              {/* Generate page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Simple logic to show pages around current page
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (page > 3) {
                    pageNum = page - 3 + i;
                  }
                  if (page > totalPages - 2) {
                    pageNum = totalPages - 5 + i + 1;
                  }
                  pageNum = Math.min(Math.max(1, pageNum), totalPages);
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href='#'
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(pageNum);
                      }}
                      isActive={page === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  href='#'
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) handlePageChange(page + 1);
                  }}
                  className={
                    page >= totalPages ? 'pointer-events-none opacity-50' : ''
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
