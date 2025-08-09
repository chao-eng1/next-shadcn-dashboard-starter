'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Target,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  DollarSign,
  FileText,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { format, subDays, subWeeks, subMonths } from 'date-fns';

interface RequirementStatsData {
  totalRequirements: number;
  completedRequirements: number;
  inProgressRequirements: number;
  pendingRequirements: number;
  rejectedRequirements: number;
  averageCompletionTime: number;
  totalBusinessValue: number;
  totalEffort: number;
  activeProjects: number;
  activeAssignees: number;
  statusDistribution: {
    status: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  priorityDistribution: {
    priority: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  typeDistribution: {
    type: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  complexityDistribution: {
    complexity: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  progressOverTime: {
    date: string;
    completed: number;
    inProgress: number;
    total: number;
  }[];
  businessValueTrend: {
    date: string;
    value: number;
    cumulative: number;
  }[];
  effortTrend: {
    date: string;
    effort: number;
    cumulative: number;
  }[];
  assigneeStats: {
    assignee: string;
    total: number;
    completed: number;
    inProgress: number;
    completionRate: number;
  }[];
  projectStats: {
    project: string;
    total: number;
    completed: number;
    inProgress: number;
    completionRate: number;
    businessValue: number;
  }[];
}

interface RequirementStatsProps {
  data?: RequirementStatsData;
  loading?: boolean;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange?: (range: '7d' | '30d' | '90d' | '1y') => void;
  onRefresh?: () => void;
  onExport?: (format: 'csv' | 'pdf' | 'excel') => void;
}

// Mock data
const mockData: RequirementStatsData = {
  totalRequirements: 156,
  completedRequirements: 89,
  inProgressRequirements: 34,
  pendingRequirements: 28,
  rejectedRequirements: 5,
  averageCompletionTime: 12.5,
  totalBusinessValue: 8750,
  totalEffort: 1240,
  activeProjects: 8,
  activeAssignees: 15,
  statusDistribution: [
    { status: 'Completed', count: 89, percentage: 57.1, color: '#16a34a' },
    { status: 'In Progress', count: 34, percentage: 21.8, color: '#2563eb' },
    { status: 'Pending', count: 28, percentage: 17.9, color: '#d97706' },
    { status: 'Rejected', count: 5, percentage: 3.2, color: '#dc2626' }
  ],
  priorityDistribution: [
    { priority: 'Critical', count: 12, percentage: 7.7, color: '#dc2626' },
    { priority: 'High', count: 45, percentage: 28.8, color: '#ea580c' },
    { priority: 'Medium', count: 67, percentage: 42.9, color: '#d97706' },
    { priority: 'Low', count: 32, percentage: 20.5, color: '#6b7280' }
  ],
  typeDistribution: [
    { type: 'Functional', count: 78, percentage: 50.0, color: '#2563eb' },
    { type: 'Non-Functional', count: 34, percentage: 21.8, color: '#7c3aed' },
    { type: 'Business', count: 28, percentage: 17.9, color: '#059669' },
    { type: 'Technical', count: 16, percentage: 10.3, color: '#dc2626' }
  ],
  complexityDistribution: [
    { complexity: 'Simple', count: 62, percentage: 39.7, color: '#16a34a' },
    { complexity: 'Medium', count: 71, percentage: 45.5, color: '#d97706' },
    { complexity: 'Complex', count: 23, percentage: 14.7, color: '#dc2626' }
  ],
  progressOverTime: [
    { date: '2024-01-01', completed: 45, inProgress: 12, total: 67 },
    { date: '2024-01-08', completed: 52, inProgress: 15, total: 78 },
    { date: '2024-01-15', completed: 61, inProgress: 18, total: 89 },
    { date: '2024-01-22', completed: 68, inProgress: 22, total: 102 },
    { date: '2024-01-29', completed: 75, inProgress: 28, total: 118 },
    { date: '2024-02-05', completed: 82, inProgress: 31, total: 134 },
    { date: '2024-02-12', completed: 89, inProgress: 34, total: 156 }
  ],
  businessValueTrend: [
    { date: '2024-01-01', value: 450, cumulative: 3200 },
    { date: '2024-01-08', value: 380, cumulative: 3580 },
    { date: '2024-01-15', value: 520, cumulative: 4100 },
    { date: '2024-01-22', value: 420, cumulative: 4520 },
    { date: '2024-01-29', value: 680, cumulative: 5200 },
    { date: '2024-02-05', value: 590, cumulative: 5790 },
    { date: '2024-02-12', value: 960, cumulative: 6750 }
  ],
  effortTrend: [
    { date: '2024-01-01', effort: 65, cumulative: 450 },
    { date: '2024-01-08', effort: 48, cumulative: 498 },
    { date: '2024-01-15', effort: 72, cumulative: 570 },
    { date: '2024-01-22', effort: 55, cumulative: 625 },
    { date: '2024-01-29', effort: 89, cumulative: 714 },
    { date: '2024-02-05', effort: 76, cumulative: 790 },
    { date: '2024-02-12', effort: 125, cumulative: 915 }
  ],
  assigneeStats: [
    {
      assignee: 'Alice Johnson',
      total: 23,
      completed: 18,
      inProgress: 5,
      completionRate: 78.3
    },
    {
      assignee: 'Bob Smith',
      total: 19,
      completed: 15,
      inProgress: 4,
      completionRate: 78.9
    },
    {
      assignee: 'Carol Davis',
      total: 21,
      completed: 14,
      inProgress: 6,
      completionRate: 66.7
    },
    {
      assignee: 'David Wilson',
      total: 17,
      completed: 13,
      inProgress: 3,
      completionRate: 76.5
    },
    {
      assignee: 'Eve Brown',
      total: 15,
      completed: 12,
      inProgress: 2,
      completionRate: 80.0
    }
  ],
  projectStats: [
    {
      project: 'User Management',
      total: 34,
      completed: 22,
      inProgress: 8,
      completionRate: 64.7,
      businessValue: 2100
    },
    {
      project: 'E-commerce Platform',
      total: 28,
      completed: 18,
      inProgress: 7,
      completionRate: 64.3,
      businessValue: 1850
    },
    {
      project: 'Analytics Dashboard',
      total: 22,
      completed: 16,
      inProgress: 4,
      completionRate: 72.7,
      businessValue: 1420
    },
    {
      project: 'Mobile App',
      total: 19,
      completed: 11,
      inProgress: 6,
      completionRate: 57.9,
      businessValue: 1180
    },
    {
      project: 'API Gateway',
      total: 16,
      completed: 12,
      inProgress: 3,
      completionRate: 75.0,
      businessValue: 980
    }
  ]
};

const COLORS = {
  primary: '#2563eb',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#0891b2',
  purple: '#7c3aed',
  gray: '#6b7280'
};

export function RequirementStats({
  data = mockData,
  loading = false,
  timeRange = '30d',
  onTimeRangeChange,
  onRefresh,
  onExport
}: RequirementStatsProps) {
  const t = useTranslations('requirements');
  const [activeTab, setActiveTab] = useState('overview');

  const completionRate =
    data.totalRequirements > 0
      ? (data.completedRequirements / data.totalRequirements) * 100
      : 0;

  const progressRate =
    data.totalRequirements > 0
      ? ((data.completedRequirements + data.inProgressRequirements) /
          data.totalRequirements) *
        100
      : 0;

  const rejectionRate =
    data.totalRequirements > 0
      ? (data.rejectedRequirements / data.totalRequirements) * 100
      : 0;

  const averageBusinessValue =
    data.totalRequirements > 0
      ? data.totalBusinessValue / data.totalRequirements
      : 0;

  const averageEffort =
    data.totalRequirements > 0 ? data.totalEffort / data.totalRequirements : 0;

  const renderMetricCard = (
    title: string,
    value: string | number,
    change?: number,
    icon: React.ReactNode,
    color: string = 'blue'
  ) => (
    <Card>
      <CardContent className='p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-gray-600'>{title}</p>
            <p className='text-2xl font-bold'>{value}</p>
            {change !== undefined && (
              <div
                className={cn(
                  'mt-1 flex items-center text-xs',
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {change >= 0 ? (
                  <TrendingUp className='mr-1 h-3 w-3' />
                ) : (
                  <TrendingDown className='mr-1 h-3 w-3' />
                )}
                {Math.abs(change)}%
              </div>
            )}
          </div>
          <div
            className={cn(
              'rounded-full p-3',
              color === 'blue' && 'bg-blue-100 text-blue-600',
              color === 'green' && 'bg-green-100 text-green-600',
              color === 'orange' && 'bg-orange-100 text-orange-600',
              color === 'red' && 'bg-red-100 text-red-600',
              color === 'purple' && 'bg-purple-100 text-purple-600'
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderPieChart = (
    data: any[],
    dataKey: string,
    nameKey: string,
    title: string
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg'>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='h-64'>
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={data}
                cx='50%'
                cy='50%'
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey={dataKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, name: any) => [
                  `${value} (${data.find((d) => d[nameKey] === name)?.percentage}%)`,
                  name
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className='mt-4 space-y-2'>
          {data.map((item, index) => (
            <div
              key={index}
              className='flex items-center justify-between text-sm'
            >
              <div className='flex items-center gap-2'>
                <div
                  className='h-3 w-3 rounded-full'
                  style={{ backgroundColor: item.color }}
                />
                <span>{item[nameKey]}</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='font-medium'>{item[dataKey]}</span>
                <span className='text-gray-500'>({item.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderProgressChart = () => (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg'>Progress Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='h-64'>
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart data={data.progressOverTime}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis
                dataKey='date'
                tickFormatter={(value) => format(new Date(value), 'MMM d')}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) =>
                  format(new Date(value), 'MMM d, yyyy')
                }
              />
              <Legend />
              <Area
                type='monotone'
                dataKey='total'
                stackId='1'
                stroke={COLORS.gray}
                fill={COLORS.gray}
                fillOpacity={0.3}
                name='Total'
              />
              <Area
                type='monotone'
                dataKey='completed'
                stackId='2'
                stroke={COLORS.success}
                fill={COLORS.success}
                fillOpacity={0.6}
                name='Completed'
              />
              <Area
                type='monotone'
                dataKey='inProgress'
                stackId='2'
                stroke={COLORS.primary}
                fill={COLORS.primary}
                fillOpacity={0.6}
                name='In Progress'
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const renderValueTrendChart = () => (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg'>
          Business Value & Effort Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='h-64'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={data.businessValueTrend}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis
                dataKey='date'
                tickFormatter={(value) => format(new Date(value), 'MMM d')}
              />
              <YAxis yAxisId='left' />
              <YAxis yAxisId='right' orientation='right' />
              <Tooltip
                labelFormatter={(value) =>
                  format(new Date(value), 'MMM d, yyyy')
                }
              />
              <Legend />
              <Line
                yAxisId='left'
                type='monotone'
                dataKey='value'
                stroke={COLORS.success}
                strokeWidth={2}
                name='Business Value'
              />
              <Line
                yAxisId='right'
                type='monotone'
                dataKey='cumulative'
                stroke={COLORS.primary}
                strokeWidth={2}
                strokeDasharray='5 5'
                name='Cumulative Value'
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const renderAssigneeStats = () => (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg'>Assignee Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {data.assigneeStats.map((assignee, index) => (
            <div key={index} className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='font-medium'>{assignee.assignee}</span>
                <div className='flex items-center gap-4 text-sm text-gray-600'>
                  <span>
                    {assignee.completed}/{assignee.total}
                  </span>
                  <span className='font-medium'>
                    {assignee.completionRate}%
                  </span>
                </div>
              </div>
              <Progress value={assignee.completionRate} className='h-2' />
              <div className='flex justify-between text-xs text-gray-500'>
                <span>{assignee.completed} completed</span>
                <span>{assignee.inProgress} in progress</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderProjectStats = () => (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg'>Project Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {data.projectStats.map((project, index) => (
            <div key={index} className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='font-medium'>{project.project}</span>
                <div className='flex items-center gap-4 text-sm text-gray-600'>
                  <span>
                    {project.completed}/{project.total}
                  </span>
                  <span className='font-medium'>{project.completionRate}%</span>
                  <Badge variant='outline' className='text-xs'>
                    ${project.businessValue}
                  </Badge>
                </div>
              </div>
              <Progress value={project.completionRate} className='h-2' />
              <div className='flex justify-between text-xs text-gray-500'>
                <span>{project.completed} completed</span>
                <span>{project.inProgress} in progress</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className='space-y-6'>
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className='p-6'>
              <div className='animate-pulse space-y-3'>
                <div className='h-4 w-1/4 rounded bg-gray-200'></div>
                <div className='h-8 w-1/2 rounded bg-gray-200'></div>
                <div className='h-4 w-1/3 rounded bg-gray-200'></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Requirement Statistics</h1>
          <p className='text-gray-600'>Comprehensive analytics and insights</p>
        </div>

        <div className='flex items-center gap-2'>
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className='w-32'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='7d'>Last 7 days</SelectItem>
              <SelectItem value='30d'>Last 30 days</SelectItem>
              <SelectItem value='90d'>Last 90 days</SelectItem>
              <SelectItem value='1y'>Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button variant='outline' size='sm' onClick={onRefresh}>
            <RefreshCw className='h-4 w-4' />
          </Button>

          <Select onValueChange={(value) => onExport?.(value as any)}>
            <SelectTrigger className='w-32'>
              <SelectValue placeholder='Export' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='csv'>Export CSV</SelectItem>
              <SelectItem value='pdf'>Export PDF</SelectItem>
              <SelectItem value='excel'>Export Excel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
        {renderMetricCard(
          'Total Requirements',
          data.totalRequirements,
          8.2,
          <FileText className='h-6 w-6' />,
          'blue'
        )}

        {renderMetricCard(
          'Completion Rate',
          `${completionRate.toFixed(1)}%`,
          2.1,
          <CheckCircle2 className='h-6 w-6' />,
          'green'
        )}

        {renderMetricCard(
          'Avg. Completion Time',
          `${data.averageCompletionTime} days`,
          -5.3,
          <Clock className='h-6 w-6' />,
          'orange'
        )}

        {renderMetricCard(
          'Business Value',
          `$${data.totalBusinessValue.toLocaleString()}`,
          12.7,
          <DollarSign className='h-6 w-6' />,
          'purple'
        )}
      </div>

      {/* Secondary Metrics */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
        {renderMetricCard(
          'Active Projects',
          data.activeProjects,
          undefined,
          <Target className='h-6 w-6' />,
          'blue'
        )}

        {renderMetricCard(
          'Active Assignees',
          data.activeAssignees,
          undefined,
          <Users className='h-6 w-6' />,
          'green'
        )}

        {renderMetricCard(
          'Total Effort',
          `${data.totalEffort} pts`,
          undefined,
          <Zap className='h-6 w-6' />,
          'orange'
        )}

        {renderMetricCard(
          'Rejection Rate',
          `${rejectionRate.toFixed(1)}%`,
          undefined,
          <AlertCircle className='h-6 w-6' />,
          'red'
        )}
      </div>

      {/* Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='distributions'>Distributions</TabsTrigger>
          <TabsTrigger value='trends'>Trends</TabsTrigger>
          <TabsTrigger value='performance'>Performance</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            {renderPieChart(
              data.statusDistribution,
              'count',
              'status',
              'Status Distribution'
            )}
            {renderPieChart(
              data.priorityDistribution,
              'count',
              'priority',
              'Priority Distribution'
            )}
          </div>

          <div className='grid grid-cols-1 gap-6'>{renderProgressChart()}</div>
        </TabsContent>

        <TabsContent value='distributions' className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            {renderPieChart(
              data.typeDistribution,
              'count',
              'type',
              'Type Distribution'
            )}
            {renderPieChart(
              data.complexityDistribution,
              'count',
              'complexity',
              'Complexity Distribution'
            )}
          </div>
        </TabsContent>

        <TabsContent value='trends' className='space-y-6'>
          <div className='grid grid-cols-1 gap-6'>
            {renderValueTrendChart()}
            {renderProgressChart()}
          </div>
        </TabsContent>

        <TabsContent value='performance' className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            {renderAssigneeStats()}
            {renderProjectStats()}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RequirementStats;
