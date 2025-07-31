'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useDebounce } from '@/hooks/use-debounce';
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
import {
  ArrowUpDown,
  EyeIcon,
  SearchIcon,
  Loader2,
  AlertCircleIcon
} from 'lucide-react';
import { EditProjectDialog } from './edit-project-dialog';
import { DeleteProjectDialog } from './delete-project-dialog';
import { PROJECT_STATUS, PROJECT_VISIBILITY } from '@/constants/project';
import { format } from 'date-fns';

interface ProjectListProps {
  userId: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: keyof typeof PROJECT_STATUS;
  visibility: keyof typeof PROJECT_VISIBILITY;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  _count: {
    members: number;
    tasks: number;
    sprints: number;
  };
}

interface ApiResponse {
  success: boolean;
  data: {
    projects: Project[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export function ProjectList({ userId }: ProjectListProps) {
  const t = useTranslations('projects');
  const tCommon = useTranslations('common');
  const tTable = useTranslations('table');

  const router = useRouter();
  const searchParams = useSearchParams();

  // 分页和排序状态
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 筛选和搜索状态
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500); // 500ms debounce delay
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // 加载项目列表
  const loadProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      // 构建查询参数
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (debouncedSearch) params.set('search', debouncedSearch);
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      // 发起请求
      const response = await fetch(`/api/projects?${params.toString()}`);

      if (!response.ok) {
        throw new Error(t('messages.updateFailed'));
      }

      const data: ApiResponse = await response.json();

      if (data.success) {
        setProjects(data.data.projects);
        setTotal(data.data.pagination.total);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        throw new Error(t('messages.updateFailed'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('error'));
    } finally {
      setLoading(false);
    }
  };

  // 当依赖项变化时加载项目列表
  useEffect(() => {
    loadProjects();
  }, [page, status, sortBy, sortOrder, debouncedSearch]);

  // 当搜索词变化时重置页码
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [debouncedSearch, status, page]);

  // 处理排序
  const handleSort = (column: string) => {
    setSortOrder(sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc');
    setSortBy(column);
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

  return (
    <div className='space-y-4'>
      {/* 搜索和筛选 */}
      <div className='flex flex-col justify-between gap-4 sm:flex-row'>
        <div className='flex flex-1 gap-2'>
          <div className='relative flex-1'>
            <SearchIcon className='text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4' />
            <Input
              placeholder={t('form.placeholder.searchProject')}
              className='pl-8'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label={tCommon('search')}
            />
            {searchTerm && (
              <button
                type='button'
                onClick={() => setSearchTerm('')}
                className='text-muted-foreground hover:text-foreground absolute top-2.5 right-2.5'
                aria-label={tCommon('clear')}
                style={{ right: '10px' }}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-4 w-4'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <line x1='18' y1='6' x2='6' y2='18'></line>
                  <line x1='6' y1='6' x2='18' y2='18'></line>
                </svg>
              </button>
            )}
          </div>
          {loading && searchTerm && (
            <div className='flex items-center'>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              <span className='text-muted-foreground text-sm'>
                {tCommon('loading')}
              </span>
            </div>
          )}
        </div>
        <Select
          value={status || 'all'}
          onValueChange={(value) => {
            setStatus(value === 'all' ? undefined : value);
          }}
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder={t('status.active')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>{tTable('all')}</SelectItem>
            {Object.entries(PROJECT_STATUS).map(([key, { key: statusKey }]) => (
              <SelectItem key={key} value={key}>
                {t(`status.${statusKey}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          {/* 项目列表 */}
          <Table>
            <TableCaption>
              {t('list')} - {tTable('showing')} {total} {tTable('items')}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant='ghost'
                    onClick={() => handleSort('name')}
                    className='hover:bg-transparent'
                  >
                    {t('form.name')}
                    <ArrowUpDown className='ml-2 h-4 w-4' />
                  </Button>
                </TableHead>
                <TableHead>{tCommon('status')}</TableHead>
                <TableHead>{t('form.visibility')}</TableHead>
                <TableHead>
                  <Button
                    variant='ghost'
                    onClick={() => handleSort('updatedAt')}
                    className='hover:bg-transparent'
                  >
                    {tCommon('updated')}
                    <ArrowUpDown className='ml-2 h-4 w-4' />
                  </Button>
                </TableHead>
                <TableHead>{tTable('items')}</TableHead>
                <TableHead>{tCommon('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='py-8 text-center'>
                    {tTable('noData')}
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className='font-medium'>
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className='hover:underline'
                      >
                        {project.name}
                      </Link>
                      {project.description && (
                        <p className='text-muted-foreground line-clamp-1 text-sm'>
                          {project.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant='outline'
                        className={`bg-${PROJECT_STATUS[project.status].color}-100 text-${PROJECT_STATUS[project.status].color}-800 border-${PROJECT_STATUS[project.status].color}-200`}
                      >
                        {t(`status.${PROJECT_STATUS[project.status].key}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {t(
                        `visibility.${PROJECT_VISIBILITY[project.visibility].key}`
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(project.updatedAt), 'yyyy-MM-dd HH:mm')}
                    </TableCell>
                    <TableCell>{project._count.tasks}</TableCell>
                    <TableCell>
                      <div className='flex items-center space-x-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          className='h-8 w-8 p-0'
                          onClick={() =>
                            router.push(`/dashboard/projects/${project.id}`)
                          }
                          title={tCommon('view')}
                        >
                          <EyeIcon className='h-4 w-4' />
                          <span className='sr-only'>{tCommon('view')}</span>
                        </Button>

                        {project.owner.id === userId && (
                          <>
                            <EditProjectDialog
                              userId={userId}
                              projectId={project.id}
                            />

                            <DeleteProjectDialog
                              projectId={project.id}
                              projectName={project.name}
                              onSuccess={loadProjects}
                            />
                          </>
                        )}
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
