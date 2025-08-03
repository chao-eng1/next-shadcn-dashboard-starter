'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Activity,
  Target,
  Clock,
  Users,
  Calendar,
  Download,
  RefreshCw,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth
} from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';

interface ChartData {
  statusTrend: Array<{
    date: string;
    DRAFT: number;
    PENDING: number;
    APPROVED: number;
    IN_PROGRESS: number;
    TESTING: number;
    COMPLETED: number;
    REJECTED: number;
    CANCELLED: number;
  }>;
  priorityDistribution: Array<{
    priority: string;
    count: number;
    percentage: number;
  }>;
  typeDistribution: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  complexityVsEffort: Array<{
    complexity: string;
    averageEffort: number;
    count: number;
    businessValue: number;
  }>;
  assigneeWorkload: Array<{
    assignee: string;
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    averageEffort: number;
  }>;
  projectComparison: Array<{
    project: string;
    total: number;
    completed: number;
    completionRate: number;
    averageBusinessValue: number;
  }>;
  burndownChart: Array<{
    date: string;
    remaining: number;
    ideal: number;
    actual: number;
  }>;
  velocityChart: Array<{
    period: string;
    completed: number;
    effort: number;
    businessValue: number;
  }>;
  riskAnalysis: Array<{
    category: string;
    high: number;
    medium: number;
    low: number;
  }>;
}

interface RequirementChartsProps {
  projectId?: string;
}

const COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#8B5CF6',
  success: '#059669',
  muted: '#6B7280'
};

const STATUS_COLORS = {
  DRAFT: '#6B7280',
  PENDING: '#F59E0B',
  APPROVED: '#3B82F6',
  IN_PROGRESS: '#8B5CF6',
  TESTING: '#F97316',
  COMPLETED: '#10B981',
  REJECTED: '#EF4444',
  CANCELLED: '#6B7280'
};

const PRIORITY_COLORS = {
  LOW: '#10B981',
  MEDIUM: '#F59E0B',
  HIGH: '#F97316',
  URGENT: '#EF4444'
};

export function RequirementCharts({ projectId }: RequirementChartsProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [chartType, setChartType] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    fetchChartData();
  }, [projectId, timeRange]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (projectId) {
        params.append('projectId', projectId);
      }
      params.append('timeRange', timeRange);

      const response = await fetch(`/api/requirements/charts?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('获取图表数据失败');
      }

      const data = await response.json();
      setChartData(data.data);
    } catch (error) {
      console.error('获取图表数据失败:', error);
      toast({
        title: '错误',
        description: '获取图表数据失败，请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'png' | 'pdf' | 'excel') => {
    try {
      const params = new URLSearchParams();
      if (projectId) {
        params.append('projectId', projectId);
      }
      params.append('timeRange', timeRange);
      params.append('format', format);

      const response = await fetch(`/api/requirements/charts/export?${params}`);
      if (!response.ok) {
        throw new Error('导出失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `requirement-charts-${format}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: '成功',
        description: '图表已导出'
      });
    } catch (error) {
      console.error('导出失败:', error);
      toast({
        title: '错误',
        description: '导出失败，请稍后重试',
        variant: 'destructive'
      });
    }
  };

  const formatTrendData = () => {
    if (!chartData) return [];
    return chartData.statusTrend.map((item) => ({
      ...item,
      date: format(new Date(item.date), 'MM/dd', { locale: zhCN })
    }));
  };

  const formatPriorityData = () => {
    if (!chartData) return [];
    return chartData.priorityDistribution.map((item) => ({
      ...item,
      fill:
        PRIORITY_COLORS[item.priority as keyof typeof PRIORITY_COLORS] ||
        COLORS.muted
    }));
  };

  const formatTypeData = () => {
    if (!chartData) return [];
    const typeColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
    return chartData.typeDistribution.map((item, index) => ({
      ...item,
      fill: typeColors[index % typeColors.length]
    }));
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        {[...Array(4)].map((_, i) => (
          <div key={i} className='h-96 animate-pulse rounded bg-gray-100' />
        ))}
      </div>
    );
  }

  if (!chartData) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-12'>
          <BarChart3 className='text-muted-foreground mb-4 h-12 w-12' />
          <h3 className='mb-2 text-lg font-medium'>暂无图表数据</h3>
          <p className='text-muted-foreground'>还没有足够的数据生成图表分析</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 控制面板 */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-medium'>图表分析</h3>
          <p className='text-muted-foreground text-sm'>
            需求数据的可视化分析和趋势洞察
          </p>
        </div>
        <div className='flex items-center space-x-2'>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className='w-32'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='7'>最近7天</SelectItem>
              <SelectItem value='30'>最近30天</SelectItem>
              <SelectItem value='90'>最近90天</SelectItem>
              <SelectItem value='365'>最近一年</SelectItem>
            </SelectContent>
          </Select>
          <Button variant='outline' size='sm' onClick={fetchChartData}>
            <RefreshCw className='mr-1 h-4 w-4' />
            刷新
          </Button>
          <Select onValueChange={(value) => handleExport(value as any)}>
            <SelectTrigger className='w-24'>
              <SelectValue placeholder='导出' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='png'>PNG</SelectItem>
              <SelectItem value='pdf'>PDF</SelectItem>
              <SelectItem value='excel'>Excel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={chartType} onValueChange={setChartType}>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='overview'>概览分析</TabsTrigger>
          <TabsTrigger value='trend'>趋势分析</TabsTrigger>
          <TabsTrigger value='performance'>绩效分析</TabsTrigger>
          <TabsTrigger value='risk'>风险分析</TabsTrigger>
        </TabsList>

        {/* 概览分析 */}
        <TabsContent value='overview' className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            {/* 优先级分布 */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <PieChartIcon className='mr-2 h-5 w-5' />
                  优先级分布
                </CardTitle>
                <CardDescription>需求按优先级的分布情况</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <PieChart>
                    <Pie
                      data={formatPriorityData()}
                      cx='50%'
                      cy='50%'
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey='count'
                    >
                      {formatPriorityData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [value, `${name} 优先级`]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className='mt-4 grid grid-cols-2 gap-2'>
                  {formatPriorityData().map((item, index) => (
                    <div key={index} className='flex items-center space-x-2'>
                      <div
                        className='h-3 w-3 rounded-full'
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className='text-sm'>{item.priority}</span>
                      <span className='text-sm font-medium'>{item.count}</span>
                      <span className='text-muted-foreground text-xs'>
                        ({item.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 类型分布 */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <BarChart3 className='mr-2 h-5 w-5' />
                  类型分布
                </CardTitle>
                <CardDescription>需求按类型的分布情况</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <BarChart data={formatTypeData()}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='type' />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='count' fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* 复杂度与工作量关系 */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Target className='mr-2 h-5 w-5' />
                复杂度与工作量分析
              </CardTitle>
              <CardDescription>
                不同复杂度需求的平均工作量和业务价值
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={300}>
                <ComposedChart data={chartData.complexityVsEffort}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='complexity' />
                  <YAxis yAxisId='left' />
                  <YAxis yAxisId='right' orientation='right' />
                  <Tooltip />
                  <Bar
                    yAxisId='left'
                    dataKey='averageEffort'
                    fill={COLORS.primary}
                    name='平均工作量(小时)'
                  />
                  <Line
                    yAxisId='right'
                    type='monotone'
                    dataKey='businessValue'
                    stroke={COLORS.secondary}
                    name='业务价值'
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 趋势分析 */}
        <TabsContent value='trend' className='space-y-6'>
          {/* 状态趋势 */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Activity className='mr-2 h-5 w-5' />
                状态变化趋势
              </CardTitle>
              <CardDescription>需求状态随时间的变化趋势</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={400}>
                <AreaChart data={formatTrendData()}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='date' />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type='monotone'
                    dataKey='COMPLETED'
                    stackId='1'
                    stroke={STATUS_COLORS.COMPLETED}
                    fill={STATUS_COLORS.COMPLETED}
                    fillOpacity={0.8}
                    name='已完成'
                  />
                  <Area
                    type='monotone'
                    dataKey='IN_PROGRESS'
                    stackId='1'
                    stroke={STATUS_COLORS.IN_PROGRESS}
                    fill={STATUS_COLORS.IN_PROGRESS}
                    fillOpacity={0.8}
                    name='开发中'
                  />
                  <Area
                    type='monotone'
                    dataKey='APPROVED'
                    stackId='1'
                    stroke={STATUS_COLORS.APPROVED}
                    fill={STATUS_COLORS.APPROVED}
                    fillOpacity={0.8}
                    name='已确认'
                  />
                  <Area
                    type='monotone'
                    dataKey='PENDING'
                    stackId='1'
                    stroke={STATUS_COLORS.PENDING}
                    fill={STATUS_COLORS.PENDING}
                    fillOpacity={0.8}
                    name='待评估'
                  />
                  <Area
                    type='monotone'
                    dataKey='DRAFT'
                    stackId='1'
                    stroke={STATUS_COLORS.DRAFT}
                    fill={STATUS_COLORS.DRAFT}
                    fillOpacity={0.8}
                    name='草稿'
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 燃尽图 */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <TrendingUp className='mr-2 h-5 w-5' />
                需求燃尽图
              </CardTitle>
              <CardDescription>剩余需求数量与理想进度的对比</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={300}>
                <LineChart data={chartData.burndownChart}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='date' />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type='monotone'
                    dataKey='ideal'
                    stroke={COLORS.muted}
                    strokeDasharray='5 5'
                    name='理想进度'
                  />
                  <Line
                    type='monotone'
                    dataKey='actual'
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    name='实际进度'
                  />
                  <Line
                    type='monotone'
                    dataKey='remaining'
                    stroke={COLORS.warning}
                    strokeWidth={2}
                    name='剩余需求'
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 绩效分析 */}
        <TabsContent value='performance' className='space-y-6'>
          {/* 团队工作量 */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Users className='mr-2 h-5 w-5' />
                团队工作量分析
              </CardTitle>
              <CardDescription>各团队成员的需求分配和完成情况</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={300}>
                <BarChart data={chartData.assigneeWorkload}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='assignee' />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey='completed'
                    stackId='a'
                    fill={COLORS.success}
                    name='已完成'
                  />
                  <Bar
                    dataKey='inProgress'
                    stackId='a'
                    fill={COLORS.warning}
                    name='进行中'
                  />
                  <Bar
                    dataKey='pending'
                    stackId='a'
                    fill={COLORS.muted}
                    name='待处理'
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 项目对比 */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Target className='mr-2 h-5 w-5' />
                项目完成率对比
              </CardTitle>
              <CardDescription>
                各项目的需求完成率和业务价值对比
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={300}>
                <ComposedChart data={chartData.projectComparison}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='project' />
                  <YAxis yAxisId='left' />
                  <YAxis yAxisId='right' orientation='right' />
                  <Tooltip />
                  <Bar
                    yAxisId='left'
                    dataKey='completionRate'
                    fill={COLORS.primary}
                    name='完成率(%)'
                  />
                  <Line
                    yAxisId='right'
                    type='monotone'
                    dataKey='averageBusinessValue'
                    stroke={COLORS.secondary}
                    name='平均业务价值'
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 速度图表 */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Clock className='mr-2 h-5 w-5' />
                团队速度分析
              </CardTitle>
              <CardDescription>
                团队在不同时期的完成速度和交付价值
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={300}>
                <ComposedChart data={chartData.velocityChart}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='period' />
                  <YAxis yAxisId='left' />
                  <YAxis yAxisId='right' orientation='right' />
                  <Tooltip />
                  <Bar
                    yAxisId='left'
                    dataKey='completed'
                    fill={COLORS.primary}
                    name='完成数量'
                  />
                  <Line
                    yAxisId='right'
                    type='monotone'
                    dataKey='businessValue'
                    stroke={COLORS.secondary}
                    name='业务价值'
                  />
                  <Line
                    yAxisId='right'
                    type='monotone'
                    dataKey='effort'
                    stroke={COLORS.warning}
                    name='工作量'
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 风险分析 */}
        <TabsContent value='risk' className='space-y-6'>
          {/* 风险雷达图 */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Activity className='mr-2 h-5 w-5' />
                风险分析雷达图
              </CardTitle>
              <CardDescription>多维度风险评估和分析</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={400}>
                <RadarChart data={chartData.riskAnalysis}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey='category' />
                  <PolarRadiusAxis />
                  <Radar
                    name='高风险'
                    dataKey='high'
                    stroke={COLORS.danger}
                    fill={COLORS.danger}
                    fillOpacity={0.3}
                  />
                  <Radar
                    name='中风险'
                    dataKey='medium'
                    stroke={COLORS.warning}
                    fill={COLORS.warning}
                    fillOpacity={0.3}
                  />
                  <Radar
                    name='低风险'
                    dataKey='low'
                    stroke={COLORS.success}
                    fill={COLORS.success}
                    fillOpacity={0.3}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 风险分布 */}
          <Card>
            <CardHeader>
              <CardTitle>风险等级分布</CardTitle>
              <CardDescription>不同类别的风险等级分布情况</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={300}>
                <BarChart data={chartData.riskAnalysis}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='category' />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey='high'
                    stackId='a'
                    fill={COLORS.danger}
                    name='高风险'
                  />
                  <Bar
                    dataKey='medium'
                    stackId='a'
                    fill={COLORS.warning}
                    name='中风险'
                  />
                  <Bar
                    dataKey='low'
                    stackId='a'
                    fill={COLORS.success}
                    name='低风险'
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
