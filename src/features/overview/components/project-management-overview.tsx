'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import PageContainer from '@/components/layout/page-container';
import { ProjectStatsCards } from './project-stats-cards';
import { TaskStatusChart } from './task-status-chart';
import { ProjectProgressChart } from './project-progress-chart';
import { TaskTrendChart } from './task-trend-chart';
import { RecentTasks } from './recent-tasks';
import { SprintOverview } from './sprint-overview';
import { QuickActions } from './quick-actions';
import { useState } from 'react';

export function ProjectManagementOverview() {
  const [refreshKey, setRefreshKey] = useState(0);
  const t = useTranslations('dashboard.overview');

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleExport = () => {
    // 这里可以实现导出功能
    console.log('导出项目管理报告');
  };

  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4' key={refreshKey}>
      <div className='flex items-center justify-between space-y-2'>
        <h2 className='text-3xl font-bold tracking-tight'>项目管理概览</h2>
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleRefresh}
            className='flex items-center gap-2'
          >
            <RefreshCw className='h-4 w-4' />
            刷新
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={handleExport}
            className='flex items-center gap-2'
          >
            <Download className='h-4 w-4' />
            导出报告
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>概览</TabsTrigger>
          <TabsTrigger value='analytics'>分析</TabsTrigger>
          <TabsTrigger value='actions'>快速操作</TabsTrigger>
        </TabsList>
        
        <TabsContent value='overview' className='space-y-4'>
          {/* 项目统计卡片 */}
          <ProjectStatsCards />
          
          {/* 第一行：任务状态图表和项目进度 */}
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-2'>
            <TaskStatusChart />
            <ProjectProgressChart />
          </div>
          
          {/* 第二行：最近任务和冲刺概览 */}
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-2'>
            <RecentTasks />
            <SprintOverview />
          </div>
        </TabsContent>
        
        <TabsContent value='analytics' className='space-y-4'>
          {/* 项目统计卡片 */}
          <ProjectStatsCards />
          
          {/* 任务趋势图表 */}
          <div className='grid gap-4 md:grid-cols-1'>
            <TaskTrendChart />
          </div>
          
          {/* 详细分析图表 */}
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-2'>
            <TaskStatusChart />
            <ProjectProgressChart />
          </div>
        </TabsContent>
        
        <TabsContent value='actions' className='space-y-4'>
          {/* 快速操作 */}
          <QuickActions />
          
          {/* 最近活动概览 */}
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-2'>
            <RecentTasks />
            <SprintOverview />
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </PageContainer>
  );
}