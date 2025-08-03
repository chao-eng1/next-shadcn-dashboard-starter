'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { getApiUrl } from '@/lib/utils';
import { TASK_STATUS } from '@/constants/project';

interface TaskStatusData {
  name: string;
  value: number;
  color: string;
  status: string;
}

const STATUS_COLORS = {
  TODO: '#94a3b8',
  IN_PROGRESS: '#3b82f6',
  REVIEW: '#f59e0b',
  DONE: '#10b981',
  BLOCKED: '#ef4444'
};

const STATUS_LABELS = {
  TODO: '待办',
  IN_PROGRESS: '进行中',
  REVIEW: '审核中',
  DONE: '已完成',
  BLOCKED: '阻塞'
};

export function TaskStatusChart() {
  const [data, setData] = useState<TaskStatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const t = useTranslations('dashboard.overview');

  useEffect(() => {
    const fetchTaskStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // 获取任务数据
        const response = await fetch(getApiUrl('/api/tasks?limit=1000'), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch task stats');
        }

        const result = await response.json();
        if (result.success) {
          const tasks = result.data.tasks || [];

          // 统计各状态的任务数量
          const statusCounts: Record<string, number> = {
            TODO: 0,
            IN_PROGRESS: 0,
            REVIEW: 0,
            DONE: 0,
            BLOCKED: 0
          };

          tasks.forEach((task: any) => {
            if (statusCounts.hasOwnProperty(task.status)) {
              statusCounts[task.status]++;
            }
          });

          // 转换为图表数据格式
          const chartData = Object.entries(statusCounts)
            .filter(([_, count]) => count > 0) // 只显示有数据的状态
            .map(([status, count]) => ({
              name: STATUS_LABELS[status as keyof typeof STATUS_LABELS],
              value: count,
              color: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
              status
            }));

          setData(chartData);
          setTotal(tasks.length);
        } else {
          throw new Error(
            result.error?.message || 'Failed to fetch task stats'
          );
        }
      } catch (err) {
        console.error('Error fetching task stats:', err);
        setError(err instanceof Error ? err.message : '获取任务统计失败');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskStats();
  }, []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage =
        total > 0 ? ((data.value / total) * 100).toFixed(1) : '0';
      return (
        <div className='bg-background rounded-lg border p-2 shadow-md'>
          <p className='font-medium'>{data.name}</p>
          <p className='text-muted-foreground text-sm'>
            {data.value} 个任务 ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className='flex flex-wrap justify-center gap-4 text-sm'>
        {payload.map((entry: any, index: number) => (
          <div key={index} className='flex items-center gap-2'>
            <div
              className='h-3 w-3 rounded-full'
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.value}</span>
            <span className='text-muted-foreground'>
              ({data.find((d) => d.name === entry.value)?.value || 0})
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>任务状态分布</CardTitle>
          <CardDescription>各状态任务的分布情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex h-[300px] items-center justify-center'>
            <Loader2 className='text-primary h-8 w-8 animate-spin' />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>任务状态分布</CardTitle>
          <CardDescription>各状态任务的分布情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex h-[300px] items-center justify-center'>
            <div className='text-muted-foreground text-center'>
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
          <CardTitle>任务状态分布</CardTitle>
          <CardDescription>各状态任务的分布情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex h-[300px] items-center justify-center'>
            <div className='text-muted-foreground text-center'>
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
        <CardTitle>任务状态分布</CardTitle>
        <CardDescription>总计 {total} 个任务的状态分布情况</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='h-[300px]'>
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={data}
                cx='50%'
                cy='50%'
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey='value'
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
