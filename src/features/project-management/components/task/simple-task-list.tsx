'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, CheckCircle2, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { TASK_STATUS, TASK_PRIORITY } from '@/constants/project';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  projectId: string;
  project: {
    id: string;
    name: string;
  };
  sprint?: {
    id: string;
    name: string;
  } | null;
  assignments: {
    id: string;
    member: {
      id: string;
      user: {
        id: string;
        name: string;
        image: string | null;
      };
    };
  }[];
  _count?: {
    comments: number;
    attachments: number;
    subtasks: number;
  };
}

interface SimpleTaskListProps {
  tasks: Task[];
}

export function SimpleTaskList({ tasks }: SimpleTaskListProps) {
  const [filteredTasks, setFilteredTasks] = useState(tasks);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 状态筛选器改变
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    applyFilters(status, priorityFilter, searchQuery);
  };

  // 优先级筛选器改变
  const handlePriorityFilterChange = (priority: string) => {
    setPriorityFilter(priority);
    applyFilters(statusFilter, priority, searchQuery);
  };

  // 搜索框内容改变
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    applyFilters(statusFilter, priorityFilter, query);
  };

  // 应用所有筛选器
  const applyFilters = (status: string, priority: string, query: string) => {
    let result = [...tasks];

    // 应用状态筛选
    if (status !== 'all') {
      result = result.filter((task) => task.status === status);
    }

    // 应用优先级筛选
    if (priority !== 'all') {
      result = result.filter((task) => task.priority === priority);
    }

    // 应用搜索筛选
    if (query) {
      const lowerQuery = query.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(lowerQuery) ||
          (task.description &&
            task.description.toLowerCase().includes(lowerQuery)) ||
          task.project.name.toLowerCase().includes(lowerQuery)
      );
    }

    setFilteredTasks(result);
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    return TASK_STATUS[status as keyof typeof TASK_STATUS]?.color || 'gray';
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    return (
      TASK_PRIORITY[priority as keyof typeof TASK_PRIORITY]?.color || 'gray'
    );
  };

  // 获取头像字母
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0'>
        <div className='flex flex-1 items-center space-x-2'>
          <Input
            placeholder='搜索任务...'
            value={searchQuery}
            onChange={handleSearchChange}
            className='h-9 w-full md:w-[300px]'
          />
        </div>
        <div className='flex space-x-2'>
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className='h-9 w-[130px]'>
              <SelectValue placeholder='状态筛选' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部状态</SelectItem>
              {Object.entries(TASK_STATUS).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={priorityFilter}
            onValueChange={handlePriorityFilterChange}
          >
            <SelectTrigger className='h-9 w-[130px]'>
              <SelectValue placeholder='优先级筛选' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部优先级</SelectItem>
              {Object.entries(TASK_PRIORITY).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='rounded-md border'>
        {filteredTasks.length > 0 ? (
          <div className='divide-y'>
            {filteredTasks.map((task) => (
              <div key={task.id} className='hover:bg-muted/50 p-4'>
                <div className='flex flex-col space-y-2 md:flex-row md:items-start md:justify-between md:space-y-0'>
                  <div className='space-y-1'>
                    <div className='flex items-center space-x-2'>
                      <Link
                        href={`/dashboard/projects/${task.projectId}/tasks/${task.id}`}
                        className='font-medium hover:underline'
                      >
                        {task.title}
                      </Link>
                      <Badge
                        variant='outline'
                        className={cn(
                          'bg-' + getStatusColor(task.status) + '-50',
                          'text-' + getStatusColor(task.status) + '-700',
                          'border-' + getStatusColor(task.status) + '-200'
                        )}
                      >
                        {
                          TASK_STATUS[task.status as keyof typeof TASK_STATUS]
                            ?.label
                        }
                      </Badge>
                    </div>
                    <div className='text-muted-foreground text-sm'>
                      项目: {task.project.name}
                      {task.sprint && <span> | 迭代: {task.sprint.name}</span>}
                    </div>
                    {task.description && (
                      <p className='text-muted-foreground line-clamp-2 text-sm'>
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className='flex items-center space-x-4'>
                    <div className='flex items-center space-x-1'>
                      <Tag className='text-muted-foreground h-4 w-4' />
                      <span
                        className={cn(
                          'text-xs',
                          'text-' + getPriorityColor(task.priority) + '-600'
                        )}
                      >
                        {
                          TASK_PRIORITY[
                            task.priority as keyof typeof TASK_PRIORITY
                          ]?.label
                        }
                      </span>
                    </div>

                    {task.dueDate && (
                      <div className='flex items-center space-x-1'>
                        <Calendar className='text-muted-foreground h-4 w-4' />
                        <span className='text-muted-foreground text-xs'>
                          {format(new Date(task.dueDate), 'yyyy-MM-dd')}
                        </span>
                      </div>
                    )}

                    {task._count && task._count.subtasks > 0 && (
                      <div className='flex items-center space-x-1'>
                        <CheckCircle2 className='text-muted-foreground h-4 w-4' />
                        <span className='text-muted-foreground text-xs'>
                          {task._count.subtasks} 子任务
                        </span>
                      </div>
                    )}

                    <div className='flex -space-x-2'>
                      {task.assignments.map((assignment) => (
                        <Avatar
                          key={assignment.id}
                          className='border-background h-6 w-6 border-2'
                        >
                          {assignment.member.user.image ? (
                            <AvatarImage
                              src={assignment.member.user.image}
                              alt={assignment.member.user.name}
                            />
                          ) : (
                            <AvatarFallback>
                              {getInitials(assignment.member.user.name)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='flex h-24 items-center justify-center p-4'>
            <p className='text-muted-foreground text-center text-sm'>
              没有符合条件的任务
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
