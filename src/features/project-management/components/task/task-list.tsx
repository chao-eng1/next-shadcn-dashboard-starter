'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowUpDown,
  ChevronDown,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  Loader2,
  AlertCircleIcon,
  ListFilterIcon,
  FilterIcon
} from 'lucide-react';
import { TASK_STATUS, TASK_PRIORITY } from '@/constants/project';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';

interface TaskListProps {
  projectId: string;
  userId: string;
  sprints: {
    id: string;
    name: string;
    status: string;
  }[];
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: keyof typeof TASK_STATUS;
  priority: keyof typeof TASK_PRIORITY;
  dueDate: string | null;
  estimatedHours: number | null;
  completedAt: string | null;
  parentTaskId: string | null;
  sprintId: string | null;
  createdAt: string;
  updatedAt: string;
  assignments: {
    id: string;
    member: {
      id: string;
      user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
      };
    };
  }[];
  _count: {
    subtasks: number;
    comments: number;
    attachments: number;
  };
}

interface ApiResponse {
  success: boolean;
  data: {
    tasks: Task[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export function TaskList({ projectId, userId, sprints }: TaskListProps) {
  const router = useRouter();
  const t = useTranslations('tasks');
  const tc = useTranslations('common');

  // 分页和排序状态
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 筛选和搜索状态
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [priority, setPriority] = useState<string | undefined>(undefined);
  const [sprintId, setSprintId] = useState<string | undefined>(undefined);
  const [parentTaskId, setParentTaskId] = useState<string | undefined>('null'); // 默认显示顶级任务
  const [assignedToMe, setAssignedToMe] = useState<boolean>(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeTab, setActiveTab] = useState('all');

  // 加载任务列表
  const loadTasks = async () => {
    setLoading(true);
    setError(null);

    try {
      // 构建查询参数
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (priority) params.set('priority', priority);
      if (sprintId) params.set('sprintId', sprintId);
      if (parentTaskId) params.set('parentTaskId', parentTaskId);
      if (assignedToMe) params.set('assignedToMe', 'true');
      if (search) params.set('search', search);
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      // 发起请求
      const response = await fetch(
        `/api/projects/${projectId}/tasks?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('加载任务列表失败');
      }

      const data: ApiResponse = await response.json();

      if (data.success) {
        setTasks(data.data.tasks);
        setTotal(data.data.pagination.total);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        throw new Error('加载任务列表失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  // 当依赖项变化时加载任务列表
  useEffect(() => {
    loadTasks();
  }, [
    page,
    status,
    priority,
    sprintId,
    parentTaskId,
    assignedToMe,
    sortBy,
    sortOrder
  ]);

  // 处理搜索
  const handleSearch = () => {
    setPage(1); // 重置为第一页
    loadTasks();
  };

  // 处理排序
  const handleSort = (column: string) => {
    setSortOrder(sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc');
    setSortBy(column);
  };

  // 处理标签切换
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);

    // 根据标签设置筛选条件
    switch (tab) {
      case 'todo':
        setStatus('TODO');
        break;
      case 'in_progress':
        setStatus('IN_PROGRESS');
        break;
      case 'review':
        setStatus('REVIEW');
        break;
      case 'done':
        setStatus('DONE');
        break;
      case 'blocked':
        setStatus('BLOCKED');
        break;
      case 'my_tasks':
        setAssignedToMe(true);
        setStatus(undefined);
        break;
      default:
        setStatus(undefined);
        setAssignedToMe(false);
    }

    setPage(1);
  };

  // 清除筛选
  const clearFilters = () => {
    setStatus(undefined);
    setPriority(undefined);
    setSprintId(undefined);
    setParentTaskId('null');
    setAssignedToMe(false);
    setSearch('');
    setActiveTab('all');
    setPage(1);
  };

  // 生成分页链接
  const generatePaginationItems = () => {
    const items = [];
    const maxVisible = 3; // 减小最大可见页数，避免出现滚动条

    // 总是显示第一页
    items.push(
      <PaginationItem key='first'>
        <PaginationLink onClick={() => setPage(1)} isActive={page === 1}>
          1
        </PaginationLink>
      </PaginationItem>
    );

    // 如果总页数超过1页
    if (totalPages > 1) {
      // 计算显示的页面范围，确保不会显示太多页码导致溢出
      let startPage = Math.max(2, page - Math.floor(maxVisible / 2));
      let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);

      if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(2, endPage - (maxVisible - 1) + 1);
      }

      // 添加省略号
      if (startPage > 2) {
        items.push(
          <PaginationItem key='ellipsis-start'>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // 添加中间页
      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink onClick={() => setPage(i)} isActive={page === i}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      // 添加省略号
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key='ellipsis-end'>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // 总是显示最后一页
      items.push(
        <PaginationItem key='last'>
          <PaginationLink
            onClick={() => setPage(totalPages)}
            isActive={page === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  // 检查任务是否已分配给当前用户
  const isTaskAssignedToUser = (task: Task) => {
    return task.assignments.some(
      (assignment) => assignment.member.user.id === userId
    );
  };

  // 任务完成状态切换
  const handleTaskCompletion = async (task: Task, completed: boolean) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${task.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: completed ? 'DONE' : 'TODO',
            completedAt: completed ? new Date().toISOString() : null
          })
        }
      );

      if (!response.ok) {
        throw new Error('更新任务状态失败');
      }

      // 重新加载任务列表
      loadTasks();
    } catch (error) {
      console.error('更新任务状态失败:', error);
    }
  };

  return (
    <div className='space-y-4'>
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className='w-full'
      >
        <TabsList className='mb-4 grid grid-cols-4 md:grid-cols-7 lg:w-[600px]'>
          <TabsTrigger value='all'>{tc('all')}</TabsTrigger>
          <TabsTrigger value='todo'>{t('status.todo')}</TabsTrigger>
          <TabsTrigger value='in_progress'>{t('status.inProgress')}</TabsTrigger>
          <TabsTrigger value='review'>{t('status.review')}</TabsTrigger>
          <TabsTrigger value='done'>{t('status.done')}</TabsTrigger>
          <TabsTrigger value='blocked'>{t('status.blocked')}</TabsTrigger>
          <TabsTrigger value='my_tasks'>{t('filters.assigned')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 搜索和筛选 */}
      <div className='flex flex-col justify-between gap-4 sm:flex-row'>
        <div className='flex flex-1 gap-2'>
          <div className='relative flex-1'>
            <SearchIcon className='text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4' />
            <Input
              placeholder={t('form.placeholder.search')}
              className='pl-8'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch}>{tc('search')}</Button>
        </div>

        <div className='flex gap-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' className='flex gap-2'>
                <FilterIcon className='h-4 w-4' />
                筛选
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-80'>
              <DropdownMenuLabel>任务筛选</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <div className='space-y-4 p-2'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>优先级</label>
                  <Select
                    value={priority || ''}
                    onValueChange={(value) => setPriority(value || undefined)}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='选择优先级' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=''>所有优先级</SelectItem>
                      {Object.entries(TASK_PRIORITY).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>迭代</label>
                  <Select
                    value={sprintId || ''}
                    onValueChange={(value) => setSprintId(value || undefined)}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='选择迭代' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=''>所有迭代</SelectItem>
                      <SelectItem value='null'>未分配迭代</SelectItem>
                      {sprints.map((sprint) => (
                        <SelectItem key={sprint.id} value={sprint.id}>
                          {sprint.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>层级</label>
                  <Select
                    value={parentTaskId || ''}
                    onValueChange={(value) =>
                      setParentTaskId(value || undefined)
                    }
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='选择任务层级' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=''>所有任务</SelectItem>
                      <SelectItem value='null'>顶级任务</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='assignedToMe'
                    checked={assignedToMe}
                    onCheckedChange={(checked) =>
                      setAssignedToMe(checked as boolean)
                    }
                  />
                  <label
                    htmlFor='assignedToMe'
                    className='text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                  >
                    仅显示分配给我的任务
                  </label>
                </div>

                <div className='flex justify-between pt-2'>
                  <Button variant='outline' size='sm' onClick={clearFilters}>
                    清除筛选
                  </Button>
                  <Button
                    size='sm'
                    onClick={() => {
                      setPage(1);
                      loadTasks();
                    }}
                  >
                    应用筛选
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 错误显示 */}
      {error && (
        <div className='bg-destructive/15 text-destructive flex items-center rounded-md p-4'>
          <AlertCircleIcon className='mr-2 h-5 w-5' />
          <p>{error}</p>
        </div>
      )}

      {/* 加载状态 */}
      {loading ? (
        <div className='flex items-center justify-center py-8'>
          <Loader2 className='text-primary h-8 w-8 animate-spin' />
        </div>
      ) : (
        <>
          {/* 任务列表 */}
          <Table>
            <TableCaption>共 {total} 个任务</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[40px]'></TableHead>
                <TableHead>
                  <Button
                    variant='ghost'
                    onClick={() => handleSort('title')}
                    className='px-0 hover:bg-transparent'
                  >
                    任务标题
                    <ArrowUpDown className='ml-2 h-4 w-4' />
                  </Button>
                </TableHead>
                <TableHead>状态</TableHead>
                <TableHead>优先级</TableHead>
                <TableHead>
                  <Button
                    variant='ghost'
                    onClick={() => handleSort('dueDate')}
                    className='px-0 hover:bg-transparent'
                  >
                    截止日期
                    <ArrowUpDown className='ml-2 h-4 w-4' />
                  </Button>
                </TableHead>
                <TableHead>分配给</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className='py-8 text-center'>
                    没有找到匹配的任务
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Checkbox
                        checked={task.status === 'DONE'}
                        onCheckedChange={(checked) =>
                          handleTaskCompletion(task, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className='font-medium'>
                      <Link
                        href={`/dashboard/projects/${projectId}/tasks/${task.id}`}
                        className='hover:underline'
                      >
                        {task.title}
                      </Link>
                      {task.description && (
                        <p className='text-muted-foreground line-clamp-1 text-sm'>
                          {task.description}
                        </p>
                      )}
                      {/* 子任务和评论数量 */}
                      {(task._count.subtasks > 0 ||
                        task._count.comments > 0) && (
                        <div className='mt-1 flex gap-2'>
                          {task._count.subtasks > 0 && (
                            <span className='text-muted-foreground text-xs'>
                              {t('labels.subtasks')}: {task._count.subtasks}
                            </span>
                          )}
                          {task._count.comments > 0 && (
                            <span className='text-muted-foreground text-xs'>
                              {t('labels.comments')}: {task._count.comments}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant='outline'
                        className={`bg-${TASK_STATUS[task.status].color}-100 text-${TASK_STATUS[task.status].color}-800 border-${TASK_STATUS[task.status].color}-200`}
                      >
                        {TASK_STATUS[task.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant='outline'
                        className={`bg-${TASK_PRIORITY[task.priority].color}-100 text-${TASK_PRIORITY[task.priority].color}-800 border-${TASK_PRIORITY[task.priority].color}-200`}
                      >
                        {TASK_PRIORITY[task.priority].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.dueDate ? (
                        <span
                          className={`${
                            new Date(task.dueDate) < new Date() &&
                            task.status !== 'DONE'
                              ? 'text-destructive'
                              : ''
                          }`}
                        >
                          {format(new Date(task.dueDate), 'yyyy-MM-dd')}
                        </span>
                      ) : (
                        <span className='text-muted-foreground'>未设置</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.assignments.length > 0 ? (
                        <div className='flex flex-wrap gap-1'>
                          {task.assignments.map((assignment) => (
                            <Badge
                              key={assignment.id}
                              variant='outline'
                              className={`${
                                assignment.member.user.id === userId
                                  ? 'bg-primary/10 text-primary border-primary/20'
                                  : ''
                              }`}
                            >
                              {assignment.member.user.name ||
                                assignment.member.user.email}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className='text-muted-foreground'>未分配</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center space-x-1'>
                        {/* 查看详情按钮 */}
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 p-0'
                          onClick={() =>
                            router.push(
                              `/dashboard/projects/${projectId}/tasks/${task.id}`
                            )
                          }
                          title='查看详情'
                        >
                          <EyeIcon className='h-4 w-4' />
                        </Button>

                        {/* 编辑任务按钮 */}
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 p-0'
                          onClick={() =>
                            router.push(
                              `/dashboard/projects/${projectId}/tasks/${task.id}/edit`
                            )
                          }
                          title='编辑任务'
                        >
                          <PencilIcon className='h-4 w-4' />
                        </Button>

                        {/* 删除任务按钮 */}
                        <Button
                          variant='ghost'
                          size='icon'
                          className='text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0'
                          onClick={() => {
                            if (
                              confirm('确定要删除此任务吗？此操作不可撤销。')
                            ) {
                              // 删除任务的逻辑
                              alert('删除任务功能待实现');
                            }
                          }}
                          title='删除任务'
                        >
                          <TrashIcon className='h-4 w-4' />
                        </Button>

                        {/* 状态更新下拉菜单 */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' className='h-8 w-8 p-0'>
                              <span className='sr-only'>更新状态</span>
                              <ChevronDown className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>更新状态</DropdownMenuLabel>
                            {Object.entries(TASK_STATUS).map(
                              ([key, { label }]) => (
                                <DropdownMenuItem
                                  key={key}
                                  onClick={async () => {
                                    try {
                                      const response = await fetch(
                                        `/api/projects/${projectId}/tasks/${task.id}`,
                                        {
                                          method: 'PATCH',
                                          headers: {
                                            'Content-Type': 'application/json'
                                          },
                                          body: JSON.stringify({
                                            status: key
                                          })
                                        }
                                      );

                                      if (!response.ok) {
                                        throw new Error('更新任务状态失败');
                                      }

                                      // 重新加载任务列表
                                      loadTasks();
                                    } catch (error) {
                                      console.error('更新任务状态失败:', error);
                                    }
                                  }}
                                  disabled={task.status === key}
                                >
                                  {label}
                                </DropdownMenuItem>
                              )
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className='mt-4 flex justify-end overflow-hidden'>
              <Pagination className='overflow-hidden'>
                <PaginationContent className='flex-nowrap overflow-hidden'>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage(Math.max(1, page - 1))}
                      isActive={false}
                      disabled={page === 1}
                    />
                  </PaginationItem>

                  {generatePaginationItems()}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      isActive={false}
                      disabled={page === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
}
