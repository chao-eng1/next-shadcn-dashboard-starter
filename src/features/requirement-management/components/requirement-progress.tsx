'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  BarChart3,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ProgressData {
  overview: {
    totalRequirements: number;
    completedRequirements: number;
    inProgressRequirements: number;
    overdueRequirements: number;
    completionRate: number;
    averageCompletionTime: number;
    estimatedCompletionDate: string;
    totalEffort: number;
    completedEffort: number;
    totalBusinessValue: number;
    completedBusinessValue: number;
  };
  milestones: Array<{
    id: string;
    name: string;
    description: string;
    dueDate: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
    progress: number;
    requirements: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      assignee: {
        id: string;
        name: string;
        avatar?: string;
      };
      dueDate: string;
      effort: number;
      businessValue: number;
    }>;
  }>;
  teams: Array<{
    id: string;
    name: string;
    members: Array<{
      id: string;
      name: string;
      avatar?: string;
      role: string;
    }>;
    totalRequirements: number;
    completedRequirements: number;
    inProgressRequirements: number;
    averageVelocity: number;
    currentWorkload: number;
    efficiency: number;
  }>;
  risks: Array<{
    id: string;
    type: 'SCHEDULE' | 'RESOURCE' | 'QUALITY' | 'SCOPE';
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    impact: string;
    mitigation: string;
    owner: {
      id: string;
      name: string;
      avatar?: string;
    };
    dueDate: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  }>;
  timeline: Array<{
    date: string;
    planned: number;
    actual: number;
    cumulative: number;
  }>;
}

interface RequirementProgressProps {
  projectId?: string;
}

const STATUS_CONFIG = {
  PENDING: { label: '待处理', color: 'bg-gray-500' },
  IN_PROGRESS: { label: '进行中', color: 'bg-blue-500' },
  COMPLETED: { label: '已完成', color: 'bg-green-500' },
  OVERDUE: { label: '已逾期', color: 'bg-red-500' }
};

const RISK_LEVEL_CONFIG = {
  LOW: { label: '低', color: 'bg-green-100 text-green-800' },
  MEDIUM: { label: '中', color: 'bg-yellow-100 text-yellow-800' },
  HIGH: { label: '高', color: 'bg-orange-100 text-orange-800' },
  CRITICAL: { label: '严重', color: 'bg-red-100 text-red-800' }
};

const RISK_TYPE_CONFIG = {
  SCHEDULE: { label: '进度风险', icon: Clock },
  RESOURCE: { label: '资源风险', icon: Users },
  QUALITY: { label: '质量风险', icon: Target },
  SCOPE: { label: '范围风险', icon: BarChart3 }
};

export function RequirementProgress({ projectId }: RequirementProgressProps) {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState('overview');
  const [timeRange, setTimeRange] = useState('30');
  const { toast } = useToast();

  useEffect(() => {
    fetchProgressData();
  }, [projectId, timeRange]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (projectId) {
        params.append('projectId', projectId);
      }
      params.append('timeRange', timeRange);
      
      const response = await fetch(`/api/requirements/progress?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('获取进度数据失败');
      }
      
      const data = await response.json();
      setProgressData(data.data);
    } catch (error) {
      console.error('获取进度数据失败:', error);
      toast({
        title: '错误',
        description: '获取进度数据失败，请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (projectId) {
        params.append('projectId', projectId);
      }
      params.append('timeRange', timeRange);
      
      const response = await fetch(`/api/requirements/progress/export?${params}`);
      if (!response.ok) {
        throw new Error('导出失败');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `requirement-progress-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: '成功',
        description: '进度报告已导出'
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'OVERDUE':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const calculateDaysRemaining = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    return days;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!progressData) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">暂无进度数据</h3>
          <p className="text-muted-foreground">还没有足够的数据生成进度跟踪</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">进度跟踪</h3>
          <p className="text-sm text-muted-foreground">
            需求开发进度的实时跟踪和分析
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">最近7天</SelectItem>
              <SelectItem value="30">最近30天</SelectItem>
              <SelectItem value="90">最近90天</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchProgressData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            刷新
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            导出
          </Button>
        </div>
      </div>

      {/* 总体进度概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">总体完成率</p>
                <p className="text-2xl font-bold">{progressData.overview.completionRate}%</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Target className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <Progress value={progressData.overview.completionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {progressData.overview.completedRequirements} / {progressData.overview.totalRequirements} 个需求
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">工作量完成率</p>
                <p className="text-2xl font-bold">
                  {Math.round((progressData.overview.completedEffort / progressData.overview.totalEffort) * 100)}%
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Zap className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <Progress 
              value={(progressData.overview.completedEffort / progressData.overview.totalEffort) * 100} 
              className="mt-2" 
            />
            <p className="text-xs text-muted-foreground mt-1">
              {progressData.overview.completedEffort} / {progressData.overview.totalEffort} 小时
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">业务价值实现</p>
                <p className="text-2xl font-bold">
                  {Math.round((progressData.overview.completedBusinessValue / progressData.overview.totalBusinessValue) * 100)}%
                </p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <Progress 
              value={(progressData.overview.completedBusinessValue / progressData.overview.totalBusinessValue) * 100} 
              className="mt-2" 
            />
            <p className="text-xs text-muted-foreground mt-1">
              {progressData.overview.completedBusinessValue} / {progressData.overview.totalBusinessValue} 分
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">逾期需求</p>
                <p className="text-2xl font-bold text-red-600">{progressData.overview.overdueRequirements}</p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              预计完成: {format(new Date(progressData.overview.estimatedCompletionDate), 'yyyy-MM-dd', { locale: zhCN })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={viewType} onValueChange={setViewType}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">里程碑</TabsTrigger>
          <TabsTrigger value="teams">团队进度</TabsTrigger>
          <TabsTrigger value="risks">风险管理</TabsTrigger>
          <TabsTrigger value="timeline">时间线</TabsTrigger>
        </TabsList>

        {/* 里程碑进度 */}
        <TabsContent value="overview" className="space-y-4">
          {progressData.milestones.map((milestone) => (
            <Card key={milestone.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(milestone.status)}
                    <div>
                      <CardTitle className="text-lg">{milestone.name}</CardTitle>
                      <CardDescription>{milestone.description}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={STATUS_CONFIG[milestone.status].color}>
                      {STATUS_CONFIG[milestone.status].label}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      截止: {format(new Date(milestone.dueDate), 'MM-dd', { locale: zhCN })}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">进度</span>
                    <span className="text-sm text-muted-foreground">{milestone.progress}%</span>
                  </div>
                  <Progress value={milestone.progress} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-medium">关联需求 ({milestone.requirements.length})</h4>
                  <div className="space-y-2">
                    {milestone.requirements.slice(0, 5).map((req) => (
                      <div key={req.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={req.assignee.avatar} />
                              <AvatarFallback className="text-xs">
                                {req.assignee.name.slice(0, 1)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{req.title}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {req.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {calculateDaysRemaining(req.dueDate) > 0 
                              ? `${calculateDaysRemaining(req.dueDate)}天后`
                              : `逾期${Math.abs(calculateDaysRemaining(req.dueDate))}天`
                            }
                          </span>
                        </div>
                      </div>
                    ))}
                    {milestone.requirements.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center">
                        还有 {milestone.requirements.length - 5} 个需求...
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* 团队进度 */}
        <TabsContent value="teams" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {progressData.teams.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      {team.name}
                    </CardTitle>
                    <Badge variant="outline">
                      效率: {team.efficiency}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 团队进度 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">完成进度</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round((team.completedRequirements / team.totalRequirements) * 100)}%
                      </span>
                    </div>
                    <Progress value={(team.completedRequirements / team.totalRequirements) * 100} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {team.completedRequirements} / {team.totalRequirements} 个需求
                    </p>
                  </div>

                  {/* 团队成员 */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">团队成员</h4>
                    <div className="flex flex-wrap gap-2">
                      {team.members.map((member) => (
                        <div key={member.id} className="flex items-center space-x-2 bg-gray-50 rounded-full px-3 py-1">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-xs">
                              {member.name.slice(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{member.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {member.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 团队指标 */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">平均速度</p>
                      <p className="text-lg font-semibold">{team.averageVelocity}/周</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">当前工作量</p>
                      <p className="text-lg font-semibold">{team.currentWorkload}h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 风险管理 */}
        <TabsContent value="risks" className="space-y-4">
          <div className="space-y-4">
            {progressData.risks.map((risk) => {
              const RiskIcon = RISK_TYPE_CONFIG[risk.type].icon;
              return (
                <Card key={risk.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <RiskIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium">{RISK_TYPE_CONFIG[risk.type].label}</h4>
                            <Badge className={RISK_LEVEL_CONFIG[risk.level].color}>
                              {RISK_LEVEL_CONFIG[risk.level].label}
                            </Badge>
                            <Badge variant="outline">{risk.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{risk.description}</p>
                          <div className="space-y-2">
                            <div>
                              <span className="text-sm font-medium">影响: </span>
                              <span className="text-sm">{risk.impact}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium">缓解措施: </span>
                              <span className="text-sm">{risk.mitigation}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={risk.owner.avatar} />
                            <AvatarFallback className="text-xs">
                              {risk.owner.name.slice(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{risk.owner.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          截止: {format(new Date(risk.dueDate), 'MM-dd', { locale: zhCN })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* 时间线 */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                进度时间线
              </CardTitle>
              <CardDescription>
                计划进度与实际进度的对比分析
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日期</TableHead>
                    <TableHead>计划完成</TableHead>
                    <TableHead>实际完成</TableHead>
                    <TableHead>累计完成</TableHead>
                    <TableHead>偏差</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {progressData.timeline.map((item, index) => {
                    const variance = item.actual - item.planned;
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          {format(new Date(item.date), 'MM-dd', { locale: zhCN })}
                        </TableCell>
                        <TableCell>{item.planned}</TableCell>
                        <TableCell>{item.actual}</TableCell>
                        <TableCell>{item.cumulative}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {variance > 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : variance < 0 ? (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            ) : null}
                            <span className={variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : ''}>
                              {variance > 0 ? '+' : ''}{variance}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}