'use client';

import { useState } from 'react';
import { RequirementKanban } from '@/features/requirement-management/components/requirement-kanban';
import { RequirementFilter } from '@/features/requirement-management/components/requirement-filter';
import { RequirementActions } from '@/features/requirement-management/components/requirement-actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface FilterOptions {
  search?: string;
  status?: string[];
  priority?: string[];
  type?: string[];
  complexity?: string[];
  projectId?: string[];
  assigneeId?: string[];
  creatorId?: string[];
  tags?: string[];
  dueDateFrom?: Date;
  dueDateTo?: Date;
  createdFrom?: Date;
  createdTo?: Date;
  businessValueMin?: number;
  businessValueMax?: number;
  effortMin?: number;
  effortMax?: number;
}

export default function RequirementKanbanPage() {
  const t = useTranslations('requirements');
  const [filters, setFilters] = useState<FilterOptions>({});

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    console.log('Kanban filter changed:', newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    console.log('Kanban filters cleared');
  };

  return (
    <div className='flex-1 space-y-4 p-4 pt-6 md:p-8'>
      <div className='flex items-center justify-between space-y-2'>
        <div className='flex items-center space-x-4'>
          <Link href='/dashboard/requirements'>
            <Button variant='ghost' size='sm'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              返回需求列表
            </Button>
          </Link>
          <div>
            <h2 className='text-3xl font-bold tracking-tight'>{t('kanban')}</h2>
            <p className='text-muted-foreground'>{t('views.kanbanDesc')}</p>
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          <Button variant='outline' size='sm'>
            <Settings className='mr-2 h-4 w-4' />
            看板设置
          </Button>
          <RequirementActions />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>需求看板</CardTitle>
              <CardDescription>
                拖拽需求卡片来更新状态，实时跟踪需求进度
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <RequirementFilter
              filters={filters}
              onFiltersChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              compact
            />
            <RequirementKanban />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
