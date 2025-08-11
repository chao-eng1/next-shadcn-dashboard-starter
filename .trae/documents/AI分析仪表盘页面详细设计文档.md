# AI分析仪表盘页面详细设计文档

## 1. 页面概述

AI分析仪表盘是项目管理平台的智能分析中心，通过AI技术对项目数据进行深度分析，提供项目进度、团队效率、风险预警等关键指标的可视化展示。该页面集成了数据可视化、趋势预测和智能报告生成功能，帮助项目管理者做出数据驱动的决策。

## 2. 功能需求

### 2.1 核心功能

- **项目分析**: 分析项目进度、团队效率、风险预警等关键指标
- **数据可视化**: 展示项目数据的图表分析，包括燃尽图预测、工作量分布等
- **趋势预测**: 基于历史数据预测项目完成时间、资源需求等关键信息
- **智能报告**: 自动生成项目分析报告和建议
- **实时监控**: 实时更新项目状态和关键指标

### 2.2 用户角色权限

- **普通用户**: 查看个人相关的项目分析数据
- **项目管理员**: 查看完整的项目分析报告，配置分析参数
- **系统管理员**: 查看全局分析数据，管理分析模型配置

## 3. 前端设计

### 3.1 页面布局

```typescript
// 页面布局结构
interface DashboardLayout {
  header: {
    projectSelector: ProjectSelectorComponent;
    timeRangeSelector: TimeRangeSelectorComponent;
    refreshButton: RefreshButtonComponent;
    exportButton: ExportButtonComponent;
  };
  sidebar: {
    metricFilters: MetricFiltersComponent;
    quickInsights: QuickInsightsComponent;
  };
  mainArea: {
    overviewCards: OverviewCardsComponent;
    chartsGrid: ChartsGridComponent;
    insightsPanel: InsightsPanelComponent;
  };
  bottomPanel?: {
    detailedReports: DetailedReportsComponent;
    recommendations: RecommendationsComponent;
  };
}
```

### 3.2 UI组件设计

#### 3.2.1 概览卡片组件

```typescript
// OverviewCard.tsx
interface OverviewCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period: string;
  };
  icon: React.ReactNode;
  trend?: {
    data: number[];
    color: string;
  };
  loading?: boolean;
}

const OverviewCard: React.FC<OverviewCardProps> = ({
  title,
  value,
  change,
  icon,
  trend,
  loading
}) => {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            {icon}
          </div>
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        </div>

        {trend && (
          <div className="w-16 h-8">
            <MiniChart data={trend.data} color={trend.color} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-2xl font-bold text-gray-900">
          {typeof value === 'number' ? formatNumber(value) : value}
        </div>

        {change && (
          <div className="flex items-center gap-1 text-sm">
            {change.type === 'increase' ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : change.type === 'decrease' ? (
              <TrendingDown className="w-4 h-4 text-red-500" />
            ) : (
              <Minus className="w-4 h-4 text-gray-500" />
            )}
            <span className={cn(
              "font-medium",
              change.type === 'increase' && "text-green-600",
              change.type === 'decrease' && "text-red-600",
              change.type === 'neutral' && "text-gray-600"
            )}>
              {Math.abs(change.value)}%
            </span>
            <span className="text-gray-500">vs {change.period}</span>
          </div>
        )}
      </div>
    </Card>
  );
};
```

#### 3.2.2 图表网格组件

```typescript
// ChartsGrid.tsx
interface ChartConfig {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  size: 'small' | 'medium' | 'large';
  data: any[];
  options?: any;
}

interface ChartsGridProps {
  charts: ChartConfig[];
  onChartClick?: (chartId: string) => void;
  loading?: boolean;
}

const ChartsGrid: React.FC<ChartsGridProps> = ({
  charts,
  onChartClick,
  loading
}) => {
  const getGridCols = (size: string) => {
    switch (size) {
      case 'small': return 'col-span-1';
      case 'medium': return 'col-span-2';
      case 'large': return 'col-span-3';
      default: return 'col-span-2';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {charts.map((chart) => (
        <Card
          key={chart.id}
          className={cn(
            "p-6 cursor-pointer hover:shadow-lg transition-shadow",
            getGridCols(chart.size)
          )}
          onClick={() => onChartClick?.(chart.id)}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{chart.title}</h3>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>

          <div className="h-64">
            <ChartRenderer
              type={chart.type}
              data={chart.data}
              options={chart.options}
            />
          </div>
        </Card>
      ))}
    </div>
  );
};
```

#### 3.2.3 智能洞察面板

```typescript
// InsightsPanel.tsx
interface Insight {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  actions?: {
    label: string;
    action: () => void;
  }[];
  timestamp: Date;
}

interface InsightsPanelProps {
  insights: Insight[];
  onInsightAction?: (insightId: string, actionIndex: number) => void;
  loading?: boolean;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({
  insights,
  onInsightAction,
  loading
}) => {
  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-semibold">AI智能洞察</h3>
      </div>

      <div className="space-y-4">
        {insights.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>暂无智能洞察</p>
          </div>
        ) : (
          insights.map((insight) => (
            <div key={insight.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{insight.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs font-medium",
                        getConfidenceColor(insight.confidence)
                      )}>
                        {Math.round(insight.confidence * 100)}% 置信度
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(insight.timestamp)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {insight.description}
                  </p>

                  {insight.actionable && insight.actions && (
                    <div className="flex gap-2">
                      {insight.actions.map((action, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => onInsightAction?.(insight.id, index)}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
```

#### 3.2.4 图表渲染器

```typescript
// ChartRenderer.tsx
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ChartRendererProps {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  data: any[];
  options?: {
    colors?: string[];
    xAxisKey?: string;
    yAxisKey?: string;
    showGrid?: boolean;
    showLegend?: boolean;
    showTooltip?: boolean;
  };
}

const ChartRenderer: React.FC<ChartRendererProps> = ({
  type,
  data,
  options = {}
}) => {
  const {
    colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    xAxisKey = 'name',
    yAxisKey = 'value',
    showGrid = true,
    showLegend = true,
    showTooltip = true
  } = options;

  const commonProps = {
    data,
    margin: { top: 5, right: 30, left: 20, bottom: 5 }
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey={yAxisKey}
              stroke={colors[0]}
              strokeWidth={2}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Bar dataKey={yAxisKey} fill={colors[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill={colors[0]}
              dataKey={yAxisKey}
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey={yAxisKey}
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.3}
            />
          </AreaChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis dataKey={yAxisKey} />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Scatter dataKey={yAxisKey} fill={colors[0]} />
          </ScatterChart>
        );

      default:
        return <div>不支持的图表类型</div>;
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      {renderChart()}
    </ResponsiveContainer>
  );
};
```

### 3.3 状态管理

```typescript
// useDashboardStore.ts
interface DashboardState {
  selectedProject: Project | null;
  timeRange: {
    start: Date;
    end: Date;
  };
  metrics: {
    overview: OverviewMetric[];
    charts: ChartData[];
    insights: Insight[];
  };
  loading: {
    overview: boolean;
    charts: boolean;
    insights: boolean;
  };
  error: string | null;
  filters: {
    teamMembers: string[];
    taskTypes: string[];
    priorities: string[];
  };
}

interface DashboardActions {
  setSelectedProject: (project: Project) => void;
  setTimeRange: (range: { start: Date; end: Date }) => void;
  loadDashboardData: () => Promise<void>;
  refreshData: () => Promise<void>;
  updateFilters: (filters: Partial<DashboardState['filters']>) => void;
  generateReport: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState & DashboardActions>(
  (set, get) => ({
    selectedProject: null,
    timeRange: {
      start: subDays(new Date(), 30),
      end: new Date()
    },
    metrics: {
      overview: [],
      charts: [],
      insights: []
    },
    loading: {
      overview: false,
      charts: false,
      insights: false
    },
    error: null,
    filters: {
      teamMembers: [],
      taskTypes: [],
      priorities: []
    },

    setSelectedProject: (project) => {
      set({ selectedProject: project });
      get().loadDashboardData();
    },

    setTimeRange: (range) => {
      set({ timeRange: range });
      get().loadDashboardData();
    },

    loadDashboardData: async () => {
      const { selectedProject, timeRange, filters } = get();
      if (!selectedProject) return;

      try {
        set((state) => ({
          loading: {
            ...state.loading,
            overview: true,
            charts: true,
            insights: true
          }
        }));

        const [overviewRes, chartsRes, insightsRes] = await Promise.all([
          fetch('/api/ai/analytics/overview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId: selectedProject.id,
              timeRange,
              filters
            })
          }),
          fetch('/api/ai/analytics/charts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId: selectedProject.id,
              timeRange,
              filters
            })
          }),
          fetch('/api/ai/analytics/insights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId: selectedProject.id,
              timeRange,
              filters
            })
          })
        ]);

        const [overview, charts, insights] = await Promise.all([
          overviewRes.json(),
          chartsRes.json(),
          insightsRes.json()
        ]);

        set({
          metrics: { overview, charts, insights },
          loading: { overview: false, charts: false, insights: false },
          error: null
        });
      } catch (error) {
        set({
          error: '加载仪表盘数据失败',
          loading: { overview: false, charts: false, insights: false }
        });
      }
    },

    refreshData: async () => {
      await get().loadDashboardData();
    },

    updateFilters: (newFilters) => {
      set((state) => ({
        filters: { ...state.filters, ...newFilters }
      }));
      get().loadDashboardData();
    },

    generateReport: async () => {
      const { selectedProject, timeRange, filters } = get();
      if (!selectedProject) return;

      try {
        const response = await fetch('/api/ai/analytics/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: selectedProject.id,
            timeRange,
            filters
          })
        });

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `项目分析报告_${selectedProject.name}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('生成报告失败:', error);
      }
    }
  })
);
```

### 3.4 实时数据更新

```typescript
// useRealtimeDashboard.ts
export const useRealtimeDashboard = (projectId?: string) => {
  const { refreshData, updateMetrics } = useDashboardStore();
  const { socket, isConnected } = useWebSocket();

  useEffect(() => {
    if (!socket || !projectId) return;

    // 加入项目分析房间
    socket.emit('join_project_analytics', { projectId });

    // 监听实时数据更新
    socket.on(
      'analytics_data_updated',
      (data: { type: 'overview' | 'charts' | 'insights'; data: any }) => {
        updateMetrics(data.type, data.data);
      }
    );

    // 监听项目状态变化
    socket.on('project_status_changed', () => {
      // 延迟刷新以确保数据已更新
      setTimeout(() => refreshData(), 1000);
    });

    // 监听任务状态变化
    socket.on(
      'task_status_changed',
      (data: { taskId: string; status: string }) => {
        // 增量更新相关指标
        updateTaskMetrics(data.taskId, data.status);
      }
    );

    return () => {
      socket.off('analytics_data_updated');
      socket.off('project_status_changed');
      socket.off('task_status_changed');
      socket.emit('leave_project_analytics', { projectId });
    };
  }, [socket, projectId]);

  return { isConnected };
};
```

## 4. 后端API设计

### 4.1 API接口定义

#### 4.1.1 概览数据接口

```typescript
// /api/ai/analytics/overview - POST
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const { projectId, timeRange, filters } = await request.json();

    // 验证权限
    await requireAIPermission(AI_PERMISSIONS.AI_ANALYSIS_VIEW)(request);
    await checkProjectAccess(user.id, projectId);

    // 获取项目基础数据
    const projectData = await getProjectAnalyticsData(
      projectId,
      timeRange,
      filters
    );

    // 使用AI分析生成概览指标
    const analysisChain = new ProjectAnalysisChain();
    const overview = await analysisChain.generateOverview(projectData);

    return NextResponse.json(overview);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load overview data' },
      { status: 500 }
    );
  }
}
```

#### 4.1.2 图表数据接口

```typescript
// /api/ai/analytics/charts - POST
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const { projectId, timeRange, filters } = await request.json();

    await requireAIPermission(AI_PERMISSIONS.AI_ANALYSIS_VIEW)(request);
    await checkProjectAccess(user.id, projectId);

    // 获取图表数据
    const chartGenerator = new ChartDataGenerator();
    const charts = await chartGenerator.generateCharts({
      projectId,
      timeRange,
      filters,
      userId: user.id
    });

    return NextResponse.json(charts);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load chart data' },
      { status: 500 }
    );
  }
}
```

#### 4.1.3 智能洞察接口

```typescript
// /api/ai/analytics/insights - POST
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const { projectId, timeRange, filters } = await request.json();

    await requireAIPermission(AI_PERMISSIONS.AI_ANALYSIS_VIEW)(request);
    await checkProjectAccess(user.id, projectId);

    // 使用LangGraph工作流生成智能洞察
    const insightsAgent = new ProjectInsightsAgent();
    const insights = await insightsAgent.generateInsights({
      projectId,
      timeRange,
      filters,
      userId: user.id
    });

    return NextResponse.json(insights);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
```

### 4.2 LangChain分析链

#### 4.2.1 项目分析链

```typescript
// lib/ai/project-analysis-chain.ts
import { LLMChain, SequentialChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { PromptTemplate } from 'langchain/prompts';

export class ProjectAnalysisChain {
  private llm: ChatOpenAI;
  private analysisChain: SequentialChain;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0.3
    });

    this.analysisChain = this.createAnalysisChain();
  }

  private createAnalysisChain(): SequentialChain {
    // 数据预处理链
    const dataProcessingChain = new LLMChain({
      llm: this.llm,
      prompt: PromptTemplate.fromTemplate(`
        分析以下项目数据并提取关键指标：
        
        项目数据：{projectData}
        时间范围：{timeRange}
        
        请提取以下指标：
        1. 项目进度百分比
        2. 团队效率指标
        3. 任务完成率
        4. 风险等级
        5. 资源利用率
        
        返回JSON格式的结构化数据。
      `),
      outputKey: 'processedMetrics'
    });

    // 趋势分析链
    const trendAnalysisChain = new LLMChain({
      llm: this.llm,
      prompt: PromptTemplate.fromTemplate(`
        基于以下处理后的指标数据，分析项目趋势：
        
        指标数据：{processedMetrics}
        
        请分析：
        1. 进度趋势（加速/减速/稳定）
        2. 效率变化（提升/下降/持平）
        3. 风险变化（增加/减少/稳定）
        4. 预测未来1-2周的发展趋势
        
        返回JSON格式的趋势分析结果。
      `),
      outputKey: 'trendAnalysis'
    });

    // 建议生成链
    const recommendationChain = new LLMChain({
      llm: this.llm,
      prompt: PromptTemplate.fromTemplate(`
        基于项目指标和趋势分析，生成改进建议：
        
        指标数据：{processedMetrics}
        趋势分析：{trendAnalysis}
        
        请生成：
        1. 3-5个具体的改进建议
        2. 每个建议的优先级（高/中/低）
        3. 预期效果和实施难度
        4. 建议的实施时间框架
        
        返回JSON格式的建议列表。
      `),
      outputKey: 'recommendations'
    });

    return new SequentialChain({
      chains: [dataProcessingChain, trendAnalysisChain, recommendationChain],
      inputVariables: ['projectData', 'timeRange'],
      outputVariables: ['processedMetrics', 'trendAnalysis', 'recommendations']
    });
  }

  async generateOverview(projectData: any): Promise<OverviewMetric[]> {
    try {
      const result = await this.analysisChain.call({
        projectData: JSON.stringify(projectData),
        timeRange: `${projectData.timeRange.start} 到 ${projectData.timeRange.end}`
      });

      const metrics = JSON.parse(result.processedMetrics);
      const trends = JSON.parse(result.trendAnalysis);

      return this.formatOverviewMetrics(metrics, trends);
    } catch (error) {
      console.error('生成概览数据失败:', error);
      throw new Error('分析失败');
    }
  }

  private formatOverviewMetrics(metrics: any, trends: any): OverviewMetric[] {
    return [
      {
        id: 'progress',
        title: '项目进度',
        value: `${metrics.progressPercentage}%`,
        change: {
          value: trends.progressChange || 0,
          type:
            trends.progressTrend === 'up'
              ? 'increase'
              : trends.progressTrend === 'down'
                ? 'decrease'
                : 'neutral',
          period: '上周'
        },
        icon: 'progress',
        trend: trends.progressHistory || []
      },
      {
        id: 'efficiency',
        title: '团队效率',
        value: `${metrics.teamEfficiency}%`,
        change: {
          value: trends.efficiencyChange || 0,
          type:
            trends.efficiencyTrend === 'up'
              ? 'increase'
              : trends.efficiencyTrend === 'down'
                ? 'decrease'
                : 'neutral',
          period: '上周'
        },
        icon: 'efficiency',
        trend: trends.efficiencyHistory || []
      },
      {
        id: 'completion',
        title: '任务完成率',
        value: `${metrics.completionRate}%`,
        change: {
          value: trends.completionChange || 0,
          type:
            trends.completionTrend === 'up'
              ? 'increase'
              : trends.completionTrend === 'down'
                ? 'decrease'
                : 'neutral',
          period: '上周'
        },
        icon: 'completion',
        trend: trends.completionHistory || []
      },
      {
        id: 'risk',
        title: '风险等级',
        value: metrics.riskLevel || '低',
        change: {
          value: trends.riskChange || 0,
          type:
            trends.riskTrend === 'up'
              ? 'decrease'
              : trends.riskTrend === 'down'
                ? 'increase'
                : 'neutral',
          period: '上周'
        },
        icon: 'risk',
        trend: trends.riskHistory || []
      }
    ];
  }
}
```

#### 4.2.2 图表数据生成器

```typescript
// lib/ai/chart-data-generator.ts
export class ChartDataGenerator {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0.2
    });
  }

  async generateCharts(params: {
    projectId: string;
    timeRange: { start: Date; end: Date };
    filters: any;
    userId: string;
  }): Promise<ChartConfig[]> {
    try {
      // 获取原始数据
      const rawData = await this.getRawProjectData(params);

      // 生成不同类型的图表
      const charts = await Promise.all([
        this.generateBurndownChart(rawData),
        this.generateVelocityChart(rawData),
        this.generateWorkloadDistribution(rawData),
        this.generateTaskStatusPie(rawData),
        this.generateTeamPerformance(rawData),
        this.generateRiskTrendChart(rawData)
      ]);

      return charts.filter((chart) => chart !== null);
    } catch (error) {
      console.error('生成图表数据失败:', error);
      throw new Error('图表生成失败');
    }
  }

  private async generateBurndownChart(data: any): Promise<ChartConfig> {
    const burndownData = this.calculateBurndownData(data);

    return {
      id: 'burndown',
      title: '燃尽图',
      type: 'line',
      size: 'large',
      data: burndownData,
      options: {
        colors: ['#3B82F6', '#10B981'],
        xAxisKey: 'date',
        yAxisKey: 'remaining',
        showGrid: true,
        showLegend: true
      }
    };
  }

  private async generateVelocityChart(data: any): Promise<ChartConfig> {
    const velocityData = this.calculateVelocityData(data);

    return {
      id: 'velocity',
      title: '团队速度',
      type: 'bar',
      size: 'medium',
      data: velocityData,
      options: {
        colors: ['#10B981'],
        xAxisKey: 'sprint',
        yAxisKey: 'velocity'
      }
    };
  }

  private async generateWorkloadDistribution(data: any): Promise<ChartConfig> {
    const workloadData = this.calculateWorkloadData(data);

    return {
      id: 'workload',
      title: '工作量分布',
      type: 'pie',
      size: 'medium',
      data: workloadData,
      options: {
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
      }
    };
  }

  private async getRawProjectData(params: any) {
    const { projectId, timeRange } = params;

    return await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          where: {
            createdAt: {
              gte: timeRange.start,
              lte: timeRange.end
            }
          },
          include: {
            assignee: true,
            comments: true,
            timeEntries: true
          }
        },
        members: {
          include: {
            user: true
          }
        },
        sprints: {
          where: {
            startDate: {
              gte: timeRange.start,
              lte: timeRange.end
            }
          }
        }
      }
    });
  }

  private calculateBurndownData(data: any) {
    // 计算燃尽图数据的逻辑
    const tasks = data.tasks || [];
    const totalStoryPoints = tasks.reduce(
      (sum: number, task: any) => sum + (task.storyPoints || 1),
      0
    );

    // 按日期分组计算剩余工作量
    const dailyData = this.groupTasksByDate(tasks);
    let remaining = totalStoryPoints;

    return dailyData.map((day: any) => {
      remaining -= day.completedPoints;
      return {
        date: day.date,
        remaining,
        ideal: this.calculateIdealBurndown(
          day.dayIndex,
          totalStoryPoints,
          dailyData.length
        )
      };
    });
  }

  private calculateVelocityData(data: any) {
    // 计算团队速度数据的逻辑
    const sprints = data.sprints || [];

    return sprints.map((sprint: any) => {
      const completedTasks = data.tasks.filter(
        (task: any) =>
          task.sprintId === sprint.id && task.status === 'COMPLETED'
      );

      const velocity = completedTasks.reduce(
        (sum: number, task: any) => sum + (task.storyPoints || 1),
        0
      );

      return {
        sprint: sprint.name,
        velocity,
        planned: sprint.plannedVelocity || 0
      };
    });
  }

  private calculateWorkloadData(data: any) {
    // 计算工作量分布数据的逻辑
    const members = data.members || [];

    return members.map((member: any) => {
      const memberTasks = data.tasks.filter(
        (task: any) => task.assigneeId === member.userId
      );

      const workload = memberTasks.reduce(
        (sum: number, task: any) => sum + (task.storyPoints || 1),
        0
      );

      return {
        name: member.user.name,
        value: workload,
        percentage: ((workload / data.tasks.length) * 100).toFixed(1)
      };
    });
  }
}
```

### 4.3 LangGraph智能洞察工作流

#### 4.3.1 项目洞察智能体

````python
# lib/ai/project-insights-agent.py
from typing import Dict, List, TypedDict
from langgraph import StateGraph
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate

class ProjectInsightsState(TypedDict):
    project_data: Dict
    time_range: Dict
    filters: Dict
    raw_insights: List[Dict]
    risk_analysis: Dict
    performance_analysis: Dict
    trend_analysis: Dict
    final_insights: List[Dict]

class ProjectInsightsAgent:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4", temperature=0.3)
        self.workflow = self.create_workflow()

    def create_workflow(self) -> StateGraph:
        workflow = StateGraph(ProjectInsightsState)

        # 添加工作流节点
        workflow.add_node("analyze_risks", self.analyze_risks)
        workflow.add_node("analyze_performance", self.analyze_performance)
        workflow.add_node("analyze_trends", self.analyze_trends)
        workflow.add_node("generate_insights", self.generate_insights)
        workflow.add_node("prioritize_insights", self.prioritize_insights)

        # 定义工作流路径
        workflow.set_entry_point("analyze_risks")
        workflow.add_edge("analyze_risks", "analyze_performance")
        workflow.add_edge("analyze_performance", "analyze_trends")
        workflow.add_edge("analyze_trends", "generate_insights")
        workflow.add_edge("generate_insights", "prioritize_insights")

        return workflow.compile()

    def analyze_risks(self, state: ProjectInsightsState) -> ProjectInsightsState:
        """分析项目风险"""
        prompt = ChatPromptTemplate.from_template("""
        分析以下项目数据中的潜在风险：

        项目数据：{project_data}
        时间范围：{time_range}

        请识别以下类型的风险：
        1. 进度风险（延期可能性）
        2. 资源风险（人员不足、技能缺口）
        3. 质量风险（缺陷率、测试覆盖率）
        4. 技术风险（技术债务、架构问题）
        5. 沟通风险（团队协作问题）

        对每个风险评估：
        - 风险等级（高/中/低）
        - 影响程度（1-10）
        - 发生概率（1-10）
        - 建议的缓解措施

        返回JSON格式的风险分析结果。
        """)

        response = self.llm.invoke(prompt.format(
            project_data=state["project_data"],
            time_range=state["time_range"]
        ))

        risk_analysis = self.parse_json_response(response.content)
        state["risk_analysis"] = risk_analysis

        return state

    def analyze_performance(self, state: ProjectInsightsState) -> ProjectInsightsState:
        """分析团队绩效"""
        prompt = ChatPromptTemplate.from_template("""
        分析以下项目的团队绩效表现：

        项目数据：{project_data}

        请分析：
        1. 个人绩效指标（任务完成率、质量、效率）
        2. 团队协作效果（沟通频率、协作质量）
        3. 技能匹配度（任务分配是否合理）
        4. 工作负载平衡（是否存在过载或闲置）
        5. 学习成长情况（技能提升、知识分享）

        对每个方面提供：
        - 当前状态评分（1-10）
        - 改进空间识别
        - 具体改进建议

        返回JSON格式的绩效分析结果。
        """)

        response = self.llm.invoke(prompt.format(
            project_data=state["project_data"]
        ))

        performance_analysis = self.parse_json_response(response.content)
        state["performance_analysis"] = performance_analysis

        return state

    def analyze_trends(self, state: ProjectInsightsState) -> ProjectInsightsState:
        """分析发展趋势"""
        prompt = ChatPromptTemplate.from_template("""
        基于历史数据分析项目发展趋势：

        项目数据：{project_data}
        时间范围：{time_range}

        请分析以下趋势：
        1. 进度趋势（加速/减速/稳定）
        2. 质量趋势（提升/下降/稳定）
        3. 效率趋势（改善/恶化/持平）
        4. 团队士气趋势（提升/下降/稳定）
        5. 技术债务趋势（增加/减少/稳定）

        对每个趋势提供：
        - 趋势方向和强度
        - 关键影响因素
        - 未来1-2周预测
        - 建议的应对策略

        返回JSON格式的趋势分析结果。
        """)

        response = self.llm.invoke(prompt.format(
            project_data=state["project_data"],
            time_range=state["time_range"]
        ))

        trend_analysis = self.parse_json_response(response.content)
        state["trend_analysis"] = trend_analysis

        return state

    def generate_insights(self, state: ProjectInsightsState) -> ProjectInsightsState:
        """生成智能洞察"""
        prompt = ChatPromptTemplate.from_template("""
        基于以下分析结果，生成具体的项目洞察：

        风险分析：{risk_analysis}
        绩效分析：{performance_analysis}
        趋势分析：{trend_analysis}

        请生成5-8个具体的洞察，每个洞察包含：
        1. 洞察标题（简洁明了）
        2. 详细描述（问题或机会的具体说明）
        3. 洞察类型（warning/info/success/error）
        4. 置信度（0.0-1.0）
        5. 是否可执行（true/false）
        6. 建议的行动方案（如果可执行）
        7. 预期影响（高/中/低）

        优先关注：
        - 高风险问题
        - 明显的改进机会
        - 异常的趋势变化
        - 可立即采取行动的问题

        返回JSON格式的洞察列表。
        """)

        response = self.llm.invoke(prompt.format(
            risk_analysis=state["risk_analysis"],
            performance_analysis=state["performance_analysis"],
            trend_analysis=state["trend_analysis"]
        ))

        insights = self.parse_json_response(response.content)
        state["raw_insights"] = insights

        return state

    def prioritize_insights(self, state: ProjectInsightsState) -> ProjectInsightsState:
        """优先级排序和最终处理"""
        raw_insights = state["raw_insights"]

        # 按照置信度和影响程度排序
        prioritized_insights = sorted(
            raw_insights,
            key=lambda x: (x.get("confidence", 0) * self.get_impact_score(x.get("impact", "low"))),
            reverse=True
        )

        # 格式化为前端需要的格式
        final_insights = []
        for insight in prioritized_insights[:6]:  # 只取前6个最重要的洞察
            final_insights.append({
                "id": f"insight_{len(final_insights) + 1}",
                "type": insight.get("type", "info"),
                "title": insight.get("title", ""),
                "description": insight.get("description", ""),
                "confidence": insight.get("confidence", 0.5),
                "actionable": insight.get("actionable", False),
                "actions": insight.get("actions", []),
                "timestamp": datetime.now().isoformat()
            })

        state["final_insights"] = final_insights
        return state

    def get_impact_score(self, impact: str) -> float:
        """将影响等级转换为数值分数"""
        impact_scores = {
            "high": 1.0,
            "medium": 0.6,
            "low": 0.3
        }
        return impact_scores.get(impact.lower(), 0.3)

    def parse_json_response(self, response: str) -> Dict:
        """解析LLM返回的JSON响应"""
        try:
            import json
            # 提取JSON部分（去除可能的markdown格式）
            if "```json" in response:
                json_str = response.split("```json")[1].split("```")[0]
            else:
                json_str = response

            return json.loads(json_str.strip())
        except Exception as e:
            print(f"JSON解析失败: {e}")
            return {}

    async def generate_insights(self, params: Dict) -> List[Dict]:
        """生成项目洞察的主入口"""
        initial_state = {
            "project_data": params["project_data"],
            "time_range": params["time_range"],
            "filters": params["filters"],
            "raw_insights": [],
            "risk_analysis": {},
            "performance_analysis": {},
            "trend_analysis": {},
            "final_insights": []
        }

        final_state = await self.workflow.ainvoke(initial_state)
        return final_state["final_insights"]
````

## 5. 数据库设计

### 5.1 分析数据表结构

```prisma
// 项目分析报告表
model ProjectAnalysisReport {
  id          String   @id @default(cuid())
  projectId   String
  type        AnalysisType
  timeRange   Json     // { start: Date, end: Date }
  metrics     Json     // 分析指标数据
  insights    Json     // AI生成的洞察
  charts      Json     // 图表配置和数据
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  creator     User     @relation(fields: [createdBy], references: [id])

  @@map("project_analysis_reports")
}

enum AnalysisType {
  OVERVIEW
  PERFORMANCE
  RISK
  TREND
  CUSTOM
}

// 分析缓存表
model AnalysisCache {
  id          String   @id @default(cuid())
  cacheKey    String   @unique
  data        Json
  expiresAt   DateTime
  createdAt   DateTime @default(now())

  @@map("analysis_cache")
}

// 项目指标历史表
model ProjectMetricHistory {
  id          String   @id @default(cuid())
  projectId   String
  metricType  String   // progress, efficiency, quality, etc.
  value       Float
  metadata    Json?
  recordedAt  DateTime @default(now())

  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@map("project_metric_history")
}

// AI洞察反馈表
model InsightFeedback {
  id          String   @id @default(cuid())
  insightId   String
  userId      String
  rating      Int      // 1-5 星评分
  helpful     Boolean
  comment     String?
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])

  @@map("insight_feedback")
}
```

### 5.2 数据访问层

```typescript
// lib/db/analytics-repository.ts
export class AnalyticsRepository {
  // 分析报告相关操作
  static async createAnalysisReport(data: {
    projectId: string;
    type: AnalysisType;
    timeRange: { start: Date; end: Date };
    metrics: object;
    insights: object;
    charts: object;
    createdBy: string;
  }) {
    return prisma.projectAnalysisReport.create({
      data: {
        ...data,
        timeRange: data.timeRange as any,
        metrics: data.metrics as any,
        insights: data.insights as any,
        charts: data.charts as any
      }
    });
  }

  static async getLatestAnalysisReport(projectId: string, type: AnalysisType) {
    return prisma.projectAnalysisReport.findFirst({
      where: { projectId, type },
      orderBy: { createdAt: 'desc' }
    });
  }

  // 指标历史相关操作
  static async recordMetric(data: {
    projectId: string;
    metricType: string;
    value: number;
    metadata?: object;
  }) {
    return prisma.projectMetricHistory.create({
      data: {
        ...data,
        metadata: data.metadata as any
      }
    });
  }

  static async getMetricHistory(
    projectId: string,
    metricType: string,
    timeRange: { start: Date; end: Date }
  ) {
    return prisma.projectMetricHistory.findMany({
      where: {
        projectId,
        metricType,
        recordedAt: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      },
      orderBy: { recordedAt: 'asc' }
    });
  }

  // 缓存相关操作
  static async getCachedAnalysis(cacheKey: string) {
    const cached = await prisma.analysisCache.findUnique({
      where: { cacheKey }
    });

    if (!cached || cached.expiresAt < new Date()) {
      return null;
    }

    return cached.data;
  }

  static async setCachedAnalysis(
    cacheKey: string,
    data: object,
    ttlMinutes: number = 30
  ) {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    return prisma.analysisCache.upsert({
      where: { cacheKey },
      update: {
        data: data as any,
        expiresAt
      },
      create: {
        cacheKey,
        data: data as any,
        expiresAt
      }
    });
  }

  // 反馈相关操作
  static async recordInsightFeedback(data: {
    insightId: string;
    userId: string;
    rating: number;
    helpful: boolean;
    comment?: string;
  }) {
    return prisma.insightFeedback.create({ data });
  }

  static async getInsightFeedbackStats(insightId: string) {
    const feedback = await prisma.insightFeedback.findMany({
      where: { insightId }
    });

    return {
      totalCount: feedback.length,
      averageRating:
        feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length,
      helpfulCount: feedback.filter((f) => f.helpful).length,
      helpfulPercentage:
        (feedback.filter((f) => f.helpful).length / feedback.length) * 100
    };
  }
}
```

## 6. 性能优化

### 6.1 前端性能优化

```typescript
// 虚拟化大数据集
const VirtualizedChartList = React.memo(({ charts }: { charts: ChartConfig[] }) => {
  const [visibleCharts, setVisibleCharts] = useState<ChartConfig[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const chartId = entry.target.getAttribute('data-chart-id');
            const chart = charts.find(c => c.id === chartId);
            if (chart && !visibleCharts.find(c => c.id === chartId)) {
              setVisibleCharts(prev => [...prev, chart]);
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    return () => observer.disconnect();
  }, [charts, visibleCharts]);

  return (
    <div ref={containerRef} className="grid grid-cols-3 gap-6">
      {charts.map((chart) => (
        <div key={chart.id} data-chart-id={chart.id} className="min-h-[300px]">
          {visibleCharts.find(c => c.id === chart.id) ? (
            <ChartRenderer {...chart} />
          ) : (
            <ChartSkeleton />
          )}
        </div>
      ))}
    </div>
  );
});

// 数据预加载和缓存
const useDashboardCache = () => {
  const cache = useRef(new Map());

  const getCachedData = useCallback((key: string) => {
    const cached = cache.current.get(key);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5分钟缓存
      return cached.data;
    }
    return null;
  }, []);

  const setCachedData = useCallback((key: string, data: any) => {
    cache.current.set(key, {
      data,
      timestamp: Date.now()
    });
  }, []);

  return { getCachedData, setCachedData };
};
```

### 6.2 后端性能优化

```typescript
// Redis缓存层
export class AnalyticsCacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
  }

  async getAnalyticsData(key: string): Promise<any | null> {
    try {
      const cached = await this.redis.get(`analytics:${key}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async setAnalyticsData(
    key: string,
    data: any,
    ttl: number = 300
  ): Promise<void> {
    try {
      await this.redis.setex(`analytics:${key}`, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`analytics:${pattern}`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis invalidate error:', error);
    }
  }
}

// 数据库查询优化
export class OptimizedAnalyticsRepository {
  static async getProjectAnalyticsData(
    projectId: string,
    timeRange: { start: Date; end: Date },
    filters: any
  ) {
    // 使用数据库索引优化查询
    const baseQuery = {
      where: {
        projectId,
        createdAt: {
          gte: timeRange.start,
          lte: timeRange.end
        },
        ...(filters.teamMembers?.length && {
          assigneeId: { in: filters.teamMembers }
        }),
        ...(filters.taskTypes?.length && {
          type: { in: filters.taskTypes }
        })
      }
    };

    // 并行查询优化
    const [tasks, timeEntries, comments] = await Promise.all([
      prisma.task.findMany({
        ...baseQuery,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          storyPoints: true,
          createdAt: true,
          updatedAt: true,
          completedAt: true,
          assigneeId: true,
          assignee: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.timeEntry.findMany({
        where: {
          task: baseQuery.where,
          createdAt: baseQuery.where.createdAt
        },
        select: {
          id: true,
          duration: true,
          taskId: true,
          userId: true,
          createdAt: true
        }
      }),
      prisma.comment.findMany({
        where: {
          task: baseQuery.where,
          createdAt: baseQuery.where.createdAt
        },
        select: {
          id: true,
          taskId: true,
          userId: true,
          createdAt: true
        }
      })
    ]);

    return { tasks, timeEntries, comments };
  }
}
```

## 7. 错误处理和监控

### 7.1 错误边界

```typescript
// DashboardErrorBoundary.tsx
class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard error:', error, errorInfo);

    // 发送错误报告
    this.reportError(error, errorInfo);
  }

  reportError = async (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          },
          errorInfo,
          context: {
            component: 'DashboardErrorBoundary',
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        })
      });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">仪表盘加载失败</h2>
          <p className="text-gray-600 mb-4">
            抱歉，仪表盘遇到了一些问题。我们已经记录了这个错误。
          </p>
          <div className="space-x-2">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
            >
              刷新页面
            </Button>
            <Button
              onClick={() => this.setState({ hasError: false })}
            >
              重试
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
```

### 7.2 API错误处理

```typescript
// lib/api/error-handler.ts
export class APIErrorHandler {
  static handleAnalyticsError(error: any, context: string) {
    const errorInfo = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    };

    // 记录错误日志
    console.error(`Analytics API Error [${context}]:`, errorInfo);

    // 根据错误类型返回适当的响应
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: '请求参数无效', details: error.message },
        { status: 400 }
      );
    }

    if (error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    if (error.name === 'RateLimitError') {
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试' },
        { status: 429 }
      );
    }

    // 默认服务器错误
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
```

### 7.3 监控指标

```typescript
// lib/monitoring/dashboard-metrics.ts
export class DashboardMetrics {
  static async recordPageLoad(projectId: string, loadTime: number) {
    await fetch('/api/metrics/page-load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: 'dashboard_page_load',
        value: loadTime,
        tags: { projectId },
        timestamp: Date.now()
      })
    });
  }

  static async recordChartRender(chartType: string, renderTime: number) {
    await fetch('/api/metrics/chart-render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: 'chart_render_time',
        value: renderTime,
        tags: { chartType },
        timestamp: Date.now()
      })
    });
  }

  static async recordInsightGeneration(duration: number, success: boolean) {
    await fetch('/api/metrics/insight-generation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: 'insight_generation',
        value: duration,
        tags: { success: success.toString() },
        timestamp: Date.now()
      })
    });
  }
}
```

## 8. 测试策略

### 8.1 单元测试

```typescript
// __tests__/components/OverviewCard.test.tsx
import { render, screen } from '@testing-library/react';
import { OverviewCard } from '@/components/dashboard/OverviewCard';

describe('OverviewCard', () => {
  const mockProps = {
    title: '项目进度',
    value: '75%',
    change: {
      value: 5,
      type: 'increase' as const,
      period: '上周'
    },
    icon: <div>Icon</div>,
    trend: {
      data: [1, 2, 3, 4, 5],
      color: '#3B82F6'
    }
  };

  it('should render card with correct data', () => {
    render(<OverviewCard {...mockProps} />);

    expect(screen.getByText('项目进度')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('5%')).toBeInTheDocument();
    expect(screen.getByText('vs 上周')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<OverviewCard {...mockProps} loading={true} />);

    expect(screen.getByTestId('overview-card-skeleton')).toBeInTheDocument();
  });

  it('should handle missing change data', () => {
    const propsWithoutChange = { ...mockProps, change: undefined };
    render(<OverviewCard {...propsWithoutChange} />);

    expect(screen.getByText('项目进度')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.queryByText('vs 上周')).not.toBeInTheDocument();
  });
});
```

### 8.2 集成测试

```typescript
// __tests__/api/analytics.test.ts
import { POST } from '@/app/api/ai/analytics/overview/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
  requireAIPermission: jest.fn(() => () => Promise.resolve())
}));

jest.mock('@/lib/ai/project-analysis-chain', () => ({
  ProjectAnalysisChain: jest.fn().mockImplementation(() => ({
    generateOverview: jest.fn().mockResolvedValue([
      {
        id: 'progress',
        title: '项目进度',
        value: '75%',
        change: { value: 5, type: 'increase', period: '上周' }
      }
    ])
  }))
}));

describe('/api/ai/analytics/overview', () => {
  it('should return overview data for valid request', async () => {
    const request = new NextRequest(
      'http://localhost/api/ai/analytics/overview',
      {
        method: 'POST',
        body: JSON.stringify({
          projectId: 'test-project-id',
          timeRange: {
            start: '2024-01-01',
            end: '2024-01-31'
          },
          filters: {}
        })
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({
      id: 'progress',
      title: '项目进度',
      value: '75%'
    });
  });

  it('should handle unauthorized access', async () => {
    // Mock unauthorized user
    require('@/lib/auth').getCurrentUser.mockRejectedValue(
      new Error('Unauthorized')
    );

    const request = new NextRequest(
      'http://localhost/api/ai/analytics/overview',
      {
        method: 'POST',
        body: JSON.stringify({ projectId: 'test-project-id' })
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});
```

## 9. 部署配置

### 9.1 环境变量

```bash
# .env.local
# AI服务配置
OPENAI_API_KEY=your_openai_api_key
LANGCHAIN_API_KEY=your_langchain_api_key
LANGCHAIN_PROJECT=ai-dashboard

# Redis配置
REDIS_URL=redis://localhost:6379

# 分析服务配置
ANALYTICS_CACHE_TTL=300
ANALYTICS_RATE_LIMIT=100
INSIGHT_GENERATION_TIMEOUT=30000

# 监控配置
METRICS_ENDPOINT=http://localhost:9090
ERROR_REPORTING_ENDPOINT=http://localhost:8080/errors
```

### 9.2 Docker配置

```dockerfile
# Dockerfile.analytics
FROM node:18-alpine

WORKDIR /app

# 安装Python依赖（用于LangGraph）
RUN apk add --no-cache python3 py3-pip

# 复制依赖文件
COPY package*.json ./
COPY requirements.txt ./

# 安装依赖
RUN npm ci --only=production
RUN pip3 install -r requirements.txt

# 复制应用代码
COPY . .

# 构建应用
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### 9.3 性能监控

```typescript
// lib/monitoring/performance.ts
export class PerformanceMonitor {
  static startTimer(name: string): () => void {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
    };
  }

  static recordMetric(
    name: string,
    value: number,
    tags?: Record<string, string>
  ) {
    // 发送到监控系统
    if (typeof window !== 'undefined') {
      // 客户端监控
      navigator.sendBeacon(
        '/api/metrics',
        JSON.stringify({
          name,
          value,
          tags,
          timestamp: Date.now()
        })
      );
    } else {
      // 服务端监控
      console.log(`Metric: ${name} = ${value}`, tags);
    }
  }

  static monitorAPICall<T>(
    apiCall: () => Promise<T>,
    name: string
  ): Promise<T> {
    const endTimer = this.startTimer(`api_call_${name}`);

    return apiCall()
      .then((result) => {
        endTimer();
        this.recordMetric(`api_success_${name}`, 1);
        return result;
      })
      .catch((error) => {
        endTimer();
        this.recordMetric(`api_error_${name}`, 1);
        throw error;
      });
  }
}
```

## 10. 总结

AI分析仪表盘页面是项目管理平台的智能分析核心，通过集成LangChain和LangGraph技术，提供了强大的数据分析和智能洞察功能。该页面的设计重点包括：

1. **智能分析**: 使用AI技术对项目数据进行深度分析，生成有价值的洞察
2. **实时更新**: 通过WebSocket实现数据的实时同步和更新
3. **性能优化**: 采用缓存、虚拟化等技术确保页面流畅运行
4. **用户体验**: 提供直观的数据可视化和交互式操作界面
5. **可扩展性**: 模块化设计支持功能的持续扩展和优化

该页面为项目管理者提供了数据驱动的决策支持，帮助提升项目管理效率和质量。
