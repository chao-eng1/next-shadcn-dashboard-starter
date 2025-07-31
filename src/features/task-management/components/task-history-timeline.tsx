'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Timeline,
  TimelineItem,
  TimelineConnector,
  TimelineHeader,
  TimelineIcon,
  TimelineBody
} from '@/components/ui/timeline';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export type TaskHistoryItem = {
  id: string;
  taskId: string;
  performedBy: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
  fromStatus: string | null;
  toStatus: string | null;
  fromAssigneeId: string | null;
  toAssigneeId: string | null;
  changeSummary: string;
  comment: string | null;
  createdAt: string;
};

interface TaskHistoryTimelineProps {
  projectId: string;
  taskId: string;
}

export function TaskHistoryTimeline({
  projectId,
  taskId
}: TaskHistoryTimelineProps) {
  const [history, setHistory] = useState<TaskHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/projects/${projectId}/tasks/${taskId}/history`,
          {
            credentials: 'include' // Include cookies for authentication
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch task history');
        }

        const data = await response.json();
        setHistory(data.data || []);
      } catch (error) {
        console.error('Error fetching task history:', error);
        toast({
          title: '获取历史记录失败',
          description: '无法加载任务历史记录',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [projectId, taskId, toast]);

  const getStatusColor = (status: string | null) => {
    if (!status) return 'gray';

    switch (status) {
      case 'TODO':
        return 'slate';
      case 'IN_PROGRESS':
        return 'blue';
      case 'REVIEW':
        return 'amber';
      case 'DONE':
        return 'green';
      case 'BLOCKED':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (item: TaskHistoryItem) => {
    if (item.fromStatus !== item.toStatus) {
      return <span className='h-2 w-2 rounded-full bg-blue-500' />;
    }

    // Check if it's an assignment change by parsing the changeSummary
    try {
      const changes = JSON.parse(item.changeSummary);
      if (changes.assignee) {
        return <span className='h-2 w-2 rounded-full bg-purple-500' />;
      }
    } catch (e) {}

    return <span className='h-2 w-2 rounded-full bg-gray-300' />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>任务历史记录</CardTitle>
        </CardHeader>
        <CardContent>
          <Timeline>
            {[1, 2, 3].map((i) => (
              <TimelineItem key={i}>
                {i < 3 && <TimelineConnector />}
                <TimelineHeader>
                  <TimelineIcon>
                    <div className='h-2 w-2 rounded-full bg-gray-300' />
                  </TimelineIcon>
                  <div className='flex items-center gap-2'>
                    <Skeleton className='h-8 w-8 rounded-full' />
                    <div>
                      <Skeleton className='h-4 w-24' />
                      <Skeleton className='mt-1 h-3 w-16' />
                    </div>
                  </div>
                </TimelineHeader>
                <TimelineBody className='pt-2'>
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='mt-1 h-4 w-3/4' />
                </TimelineBody>
              </TimelineItem>
            ))}
          </Timeline>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>任务历史记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-muted-foreground p-4 text-center'>
            暂无历史记录
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>任务历史记录</CardTitle>
      </CardHeader>
      <CardContent>
        <Timeline>
          {history.map((item, index) => (
            <TimelineItem key={item.id}>
              {index < history.length - 1 && <TimelineConnector />}
              <TimelineHeader>
                <TimelineIcon>{getStatusIcon(item)}</TimelineIcon>
                <div className='flex items-center gap-2'>
                  <Avatar className='h-8 w-8'>
                    <AvatarImage
                      src={item.performedBy.image || ''}
                      alt={item.performedBy.name || ''}
                    />
                    <AvatarFallback>
                      {(item.performedBy.name || '').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='font-medium'>{item.performedBy.name}</p>
                    <p className='text-muted-foreground text-xs'>
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true
                      })}
                    </p>
                  </div>
                </div>
              </TimelineHeader>
              <TimelineBody className='pt-2'>
                <div className='space-y-2'>
                  {item.fromStatus !== item.toStatus && (
                    <div className='flex items-center gap-2'>
                      <span>状态变更:</span>
                      {item.fromStatus && (
                        <Badge
                          variant='outline'
                          className={cn(
                            `border-${getStatusColor(item.fromStatus)}-200 bg-${getStatusColor(item.fromStatus)}-50 text-${getStatusColor(item.fromStatus)}-700`
                          )}
                        >
                          {item.fromStatus}
                        </Badge>
                      )}
                      <span>→</span>
                      {item.toStatus && (
                        <Badge
                          className={cn(
                            `bg-${getStatusColor(item.toStatus)}-100 text-${getStatusColor(item.toStatus)}-700`
                          )}
                        >
                          {item.toStatus}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Display other changes from changeSummary */}
                  {item.changeSummary && (
                    <div>
                      {(() => {
                        try {
                          const changes = JSON.parse(item.changeSummary);
                          return (
                            <div className='space-y-1'>
                              {changes.assignee && (
                                <div className='flex items-center gap-2'>
                                  <span>分配变更:</span>
                                  <span className='text-muted-foreground text-sm'>
                                    {changes.assignee.from &&
                                    changes.assignee.from.length > 0
                                      ? changes.assignee.from.join(', ')
                                      : '未分配'}{' '}
                                    →{' '}
                                    {changes.assignee.to &&
                                    changes.assignee.to.length > 0
                                      ? changes.assignee.to.join(', ')
                                      : '未分配'}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        } catch (e) {
                          return null;
                        }
                      })()}
                    </div>
                  )}

                  {item.comment && (
                    <div className='bg-muted mt-2 rounded-md p-2 text-sm'>
                      {item.comment}
                    </div>
                  )}
                </div>
              </TimelineBody>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  );
}
