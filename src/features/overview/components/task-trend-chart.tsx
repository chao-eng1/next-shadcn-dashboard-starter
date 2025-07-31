'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { getApiUrl } from '@/lib/utils';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TaskTrendData {
  date: string;
  created: number;
  completed: number;
  inProgress: number;
  total: number;
}

export function TaskTrendChart() {
  const [data, setData] = useState<TaskTrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('dashboard.overview');

  useEffect(() => {
    const fetchTaskTrend = async () => {
      try {
        setLoading(true);
        setError(null);

        // 生成过去30天的日期范围
        const days = 30;
        const endDate = new Date();
        const startDate = subDays(endDate, days - 1);
        
        // 初始化数据结构
        const trendData: TaskTrendData[] = [];
        for (let i = 0; i < days; i++) {
          const date = subDays(endDate, days - 1 - i);
          trendData.push({
            date: format(date, 'MM-dd'),
            created: 0,
            completed: 0,
            inProgress: 0,
            total: 0
          });
        }

        // 获取任务数据
        const response = await fetch(
          getApiUrl('/api/tasks?limit=1000&sortBy=createdAt&sortOrder=desc'),
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }

        const result = await response.json();
        if (result.success) {
          const tasks = result.data.tasks || [];
          
          // 统计每天的任务数据
          tasks.forEach((task: any) => {
            const createdDate = new Date(task.createdAt);
            const updatedDate = new Date(task.updatedAt);
            
            // 统计创建的任务
            if (createdDate >= startDate && createdDate <= endDate) {
              const dayIndex = Math.floor(
                (createdDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              if (dayIndex >= 0 && dayIndex < days) {
                trendData[dayIndex].created++;
                trendData[dayIndex].total++;
              }
            }
            
            // 统计完成的任务
            if (task.status === 'DONE' && updatedDate >= startDate && updatedDate <= endDate) {
              const dayIndex = Math.floor(
                (updatedDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              if (dayIndex >= 0 && dayIndex < days) {
                trendData[dayIndex].completed++;
              }
            }
            
            // 统计进行中的任务（基于最后更新时间）
            if (task.status === 'IN_PROGRESS' && updatedDate >= startDate && updatedDate <= endDate) {
              const dayIndex = Math.floor(
                (updatedDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              if (dayIndex >= 0 && dayIndex < days) {
                trendData[dayIndex].inProgress++;
              }
            }
          });
          
          setData(trendData);
        } else {
          throw new Error(result.error?.message || 'Failed to fetch tasks');
        }
      } catch (err) {
        console.error('Error fetching task trend:', err);
        setError(err instanceof Error ? err.message : '获取任务趋势失败');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskTrend();
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className='rounded-lg border bg-background p-3 shadow-md'>
          <p className='font-medium'>{`日期: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className='text-sm'>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>任务趋势</CardTitle>
          <CardDescription>过去30天的任务创建和完成趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex h-[400px] items-center justify-center'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>任务趋势</CardTitle>
          <CardDescription>过去30天的任务创建和完成趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex h-[400px] items-center justify-center'>
            <div className='text-center text-muted-foreground'>
              <p>{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>任务趋势</CardTitle>
          <CardDescription>过去30天的任务创建和完成趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex h-[400px] items-center justify-center'>
            <div className='text-center text-muted-foreground'>
              <p>暂无任务数据</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>任务趋势</CardTitle>
        <CardDescription>
          过去30天的任务创建和完成趋势
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='h-[400px] w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20
              }}
            >
              <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
              <XAxis 
                dataKey='date' 
                className='text-xs fill-muted-foreground'
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className='text-xs fill-muted-foreground'
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
              />
              
              <Area
                type='monotone'
                dataKey='created'
                stackId='1'
                stroke='hsl(var(--primary))'
                fill='hsl(var(--primary))'
                fillOpacity={0.6}
                name='新建任务'
              />
              
              <Area
                type='monotone'
                dataKey='inProgress'
                stackId='1'
                stroke='hsl(var(--chart-2))'
                fill='hsl(var(--chart-2))'
                fillOpacity={0.6}
                name='进行中任务'
              />
              
              <Area
                type='monotone'
                dataKey='completed'
                stackId='1'
                stroke='hsl(var(--chart-3))'
                fill='hsl(var(--chart-3))'
                fillOpacity={0.6}
                name='完成任务'
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className='mt-4 grid grid-cols-3 gap-4 text-center'>
          <div className='space-y-1'>
            <div className='text-2xl font-bold text-primary'>
              {data.reduce((sum, item) => sum + item.created, 0)}
            </div>
            <div className='text-xs text-muted-foreground'>总新建</div>
          </div>
          <div className='space-y-1'>
            <div className='text-2xl font-bold' style={{ color: 'hsl(var(--chart-2))' }}>
              {data.reduce((sum, item) => sum + item.inProgress, 0)}
            </div>
            <div className='text-xs text-muted-foreground'>总进行中</div>
          </div>
          <div className='space-y-1'>
            <div className='text-2xl font-bold' style={{ color: 'hsl(var(--chart-3))' }}>
              {data.reduce((sum, item) => sum + item.completed, 0)}
            </div>
            <div className='text-xs text-muted-foreground'>总完成</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}