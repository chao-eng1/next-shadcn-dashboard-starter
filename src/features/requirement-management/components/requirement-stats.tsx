'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface RequirementStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
  byComplexity: Record<string, number>;
  byProject: Array<{
    projectId: string;
    projectName: string;
    count: number;
  }>;
  byAssignee: Array<{
    assigneeId: string;
    assigneeName: string;
    count: number;
  }>;
  completionRate: number;
  averageBusinessValue: number;
  averageEstimatedEffort: number;
  totalEstimatedEffort: number;
  totalActualEffort: number;
  overdueCount: number;
  createdThisMonth: number;
  completedThisMonth: number;
  trend: Array<{
    date: string;
    created: number;
    completed: number;
    inProgress: number;
  }>;
}

interface RequirementStatsProps {
  projectId?: string;
}

const statusConfig = {
  DRAFT: { label: '草稿', color: '#6B7280' },
  PENDING: { label: '待评估', color: '#F59E0B' },
  APPROVED: { label: '已确认', color: '#3B82F6' },
  IN_PROGRESS: { label: '开发中', color: '#8B5CF6' },
  TESTING: { label: '测试中', color: '#F97316' },
  COMPLETED: { label: '已完成', color: '#10B981' },
  REJECTED: { label: '已拒绝', color: '#EF4444' },
  CANCELLED: { label: '已取消', color: '#6B7280' }
};

const priorityConfig = {
  LOW: { label: '低', color: '#10B981' },
  MEDIUM: { label: '中', color: '#F59E0B' },
  HIGH: { label: '高', color: '#F97316' },
  URGENT: { label: '紧急', color: '#EF4444' }
};

const typeConfig = {
  FUNCTIONAL: { label: '功能性', color: '#3B82F6' },
  NON_FUNCTIONAL: { label: '非功能性', color: '#8B5CF6' },
  TECHNICAL: { label: '技术性', color: '#6B7280' },
  BUSINESS: { label: '业务性', color: '#10B981' }
};

const complexityConfig = {
  SIMPLE: { label: '简单', color: '#10B981' },
  MEDIUM: { label: '中等', color: '#F59E0B' },
  COMPLEX: { label: '复杂', color: '#F97316' },
  VERY_COMPLEX: { label: '非常复杂', color: '#EF4444' }
};

export function RequirementStats({ projectId }: RequirementStatsProps) {
  const [stats, setStats] = useState<RequirementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, [projectId, timeRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (projectId) {
        params.append('projectId', projectId);
      }
      params.append('timeRange', timeRange);
      
      const response = await fetch(`/api/requirements/stats?${params}`);
      if (!response.ok) {
        throw new Error('获取统计数据失败');
      }
      
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
      toast({
        title: '错误',
        description: '获取统计数据失败，请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusData = () => {
    if (!stats || !stats.byStatus) return [];
    return Object.entries(stats.byStatus).map(([status, count]) => ({
      name: statusConfig[status as keyof typeof statusConfig]?.label || status,
      value: count,
      color: statusConfig[status as keyof typeof statusConfig]?.color || '#6B7280'
    }));
  };

  const getPriorityData = () => {
    if (!stats || !stats.byPriority) return [];
    return Object.entries(stats.byPriority).map(([priority, count]) => ({
      name: priorityConfig[priority as keyof typeof priorityConfig]?.label || priority,
      value: count,
      color: priorityConfig[priority as keyof typeof priorityConfig]?.color || '#6B7280'
    }));
  };

  const getTypeData = () => {
    if (!stats || !stats.byType) return [];
    return Object.entries(stats.byType).map(([type, count]) => ({
      name: typeConfig[type as keyof typeof typeConfig]?.label || type,
      value: count,
      color: typeConfig[type as keyof typeof typeConfig]?.color || '#6B7280'
    }));
  };

  const getComplexityData = () => {
    if (!stats || !stats.byComplexity) return [];
    return Object.entries(stats.byComplexity).map(([complexity, count]) => ({
      name: complexityConfig[complexity as keyof typeof complexityConfig]?.label || complexity,
      value: count,
      color: complexityConfig[complexity as keyof typeof complexityConfig]?.color || '#6B7280'
    }));
  };

  const getTrendData = () => {
    if (!stats || !stats.trend || !Array.isArray(stats.trend)) return [];
    return stats.trend.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    }));
  };

  const getEfficiencyRate = () => {
    if (!stats || stats.totalEstimatedEffort === 0) return 0;
    return Math.round((stats.totalActualEffort / stats.totalEstimatedEffort) * 100);
  };

  const getMonthlyGrowth = () => {
    if (!stats) return 0;
    const lastMonthCreated = stats.createdThisMonth; // 简化计算
    return lastMonthCreated > 0 ? Math.round(((stats.createdThisMonth - lastMonthCreated) / lastMonthCreated) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">暂无统计数据</h3>
          <p className="text-muted-foreground">还没有足够的数据生成统计报告</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 时间范围选择 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">需求统计</h3>
          <p className="text-sm text-muted-foreground">
            {projectId ? '项目需求统计分析' : '全局需求统计分析'}
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">最近7天</SelectItem>
            <SelectItem value="30">最近30天</SelectItem>
            <SelectItem value="90">最近90天</SelectItem>
            <SelectItem value="365">最近一年</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 美化的关键指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">总需求数</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                {getMonthlyGrowth() > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                +{stats.createdThisMonth}
              </Badge>
              <span className="text-xs text-muted-foreground">本月新增</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300">完成率</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.completionRate}%</div>
            <Progress 
              value={stats.completionRate} 
              className="mt-2 h-2 bg-green-100 dark:bg-green-900/20" 
            />
            <div className="text-xs text-muted-foreground mt-2">
              本月完成 {stats.completedThisMonth} 个
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-red-700 dark:text-red-300">逾期需求</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900 dark:text-red-100">{stats.overdueCount}</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">占总数</span>
              <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
                {stats.total > 0 ? Math.round((stats.overdueCount / stats.total) * 100) : 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300">工作量效率</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{getEfficiencyRate()}%</div>
            <div className="text-xs text-muted-foreground mt-2">
              实际 {stats.totalActualEffort}h / 预估 {stats.totalEstimatedEffort}h
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 美化的趋势图表 */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl">需求趋势</CardTitle>
              <CardDescription className="text-sm">
                需求创建、完成和进行中的趋势变化分析
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={getTrendData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area
                type="monotone"
                dataKey="created"
                stackId="1"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.7}
                name="新建"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="inProgress"
                stackId="1"
                stroke="#F59E0B"
                fill="#F59E0B"
                fillOpacity={0.7}
                name="进行中"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="completed"
                stackId="1"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.7}
                name="已完成"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 美化的分布图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 状态分布 */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <PieChartIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-xl">状态分布</CardTitle>
                <CardDescription className="text-sm">各状态需求数量占比分析</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={getStatusData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#fff"
                  >
                    {getStatusData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">总需求</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {getStatusData().map((item, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 rounded-lg bg-muted/30">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm font-bold ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 优先级分布 */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/20">
                <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-xl">优先级分布</CardTitle>
                <CardDescription className="text-sm">不同优先级需求数量统计</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={getPriorityData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#3B82F6" 
                  radius={[6, 6, 0, 0]}
                  strokeWidth={1}
                  stroke="#fff"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 项目和人员分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 项目分布 */}
        <Card>
          <CardHeader>
            <CardTitle>项目分布</CardTitle>
            <CardDescription>
              各项目的需求数量分布
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.byProject.slice(0, 5).map((project, index) => (
                <div key={project.projectId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium">{project.projectName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24">
                      <Progress 
                        value={(project.count / stats.total) * 100} 
                        className="h-2" 
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{project.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 负责人分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              负责人分布
            </CardTitle>
            <CardDescription>
              各负责人的需求数量分布
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.byAssignee.slice(0, 5).map((assignee, index) => (
                <div key={assignee.assigneeId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">{assignee.assigneeName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24">
                      <Progress 
                        value={(assignee.count / stats.total) * 100} 
                        className="h-2" 
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{assignee.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 业务价值和复杂度 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>业务价值分析</CardTitle>
            <CardDescription>
              平均业务价值: {stats.averageBusinessValue.toFixed(1)}/100
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>平均业务价值</span>
                  <span>{stats.averageBusinessValue.toFixed(1)}/100</span>
                </div>
                <Progress value={stats.averageBusinessValue} className="mt-2" />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>平均预估工作量</span>
                  <span>{stats.averageEstimatedEffort.toFixed(1)} 小时</span>
                </div>
                <Progress value={(stats.averageEstimatedEffort / 100) * 100} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>复杂度分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={getComplexityData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}