# AI模型配置页面详细设计文档

## 1. 页面概述

### 1.1 功能概述

AI模型配置页面是AI模块的核心管理界面，为系统管理员和项目管理员提供AI模型的配置、监控和管理功能。该页面支持多种AI服务提供商的配置，包括OpenAI、Claude、本地模型等，并提供实时的使用统计、成本监控和性能分析。

### 1.2 核心价值

- **统一管理**: 集中管理所有AI模型配置和API密钥
- **成本控制**: 实时监控AI服务使用成本和配额
- **性能优化**: 提供模型性能分析和优化建议
- **安全保障**: 安全的密钥管理和权限控制
- **灵活配置**: 支持多种AI服务提供商和模型类型

### 1.3 目标用户

- **系统管理员**: 全局AI配置管理和监控
- **项目管理员**: 项目级别的AI配置和使用管理
- **开发人员**: 查看AI服务状态和使用情况

## 2. 功能需求

### 2.1 AI服务提供商管理

- **多提供商支持**: OpenAI、Anthropic Claude、Google PaLM、本地模型等
- **API密钥管理**: 安全的密钥存储、轮换和验证
- **服务状态监控**: 实时检测API服务可用性
- **负载均衡**: 多个API密钥的智能分配和负载均衡

### 2.2 模型配置管理

- **模型参数设置**: Temperature、Max Tokens、Top-p等参数配置
- **模型选择**: 支持不同场景下的模型选择策略
- **预设模板**: 常用配置的快速模板
- **A/B测试**: 不同配置的效果对比测试

### 2.3 使用统计与监控

- **实时统计**: API调用次数、成功率、响应时间
- **成本分析**: 按时间、项目、用户维度的成本统计
- **配额管理**: API使用配额的设置和监控
- **告警通知**: 异常使用和成本超标的告警

### 2.4 性能优化

- **缓存策略**: 智能缓存配置和管理
- **请求优化**: 批量请求和并发控制
- **模型推荐**: 基于使用场景的模型推荐
- **性能报告**: 定期的性能分析报告

### 2.5 用户角色权限

| 角色       | 权限范围     | 核心功能                           |
| ---------- | ------------ | ---------------------------------- |
| 系统管理员 | 全局配置管理 | 所有AI服务配置、全局监控、成本管理 |
| 项目管理员 | 项目级配置   | 项目AI配置、项目使用统计、成本控制 |
| 开发人员   | 只读查看     | 查看配置状态、使用统计、性能数据   |

## 3. 前端设计

### 3.1 页面布局

```typescript
// components/ai-config/AIConfigLayout.tsx
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, BarChart3, Key, Zap, AlertTriangle } from 'lucide-react';

interface AIConfigLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AIConfigLayout({ children, activeTab, onTabChange }: AIConfigLayoutProps) {
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI模型配置</h1>
          <p className="text-muted-foreground mt-2">
            管理AI服务配置、监控使用情况和优化性能
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            服务正常
          </Badge>
          <Button variant="outline" size="sm">
            <AlertTriangle className="w-4 h-4 mr-2" />
            查看告警
          </Button>
        </div>
      </div>

      {/* 快速统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日调用</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">
              +12.5% 较昨日
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成功率</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.2%</div>
            <p className="text-xs text-muted-foreground">
              +0.3% 较昨日
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日成本</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$24.67</div>
            <p className="text-xs text-muted-foreground">
              预算剩余 $175.33
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均延迟</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2s</div>
            <p className="text-xs text-muted-foreground">
              -0.1s 较昨日
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="providers">服务提供商</TabsTrigger>
          <TabsTrigger value="models">模型配置</TabsTrigger>
          <TabsTrigger value="monitoring">使用监控</TabsTrigger>
          <TabsTrigger value="optimization">性能优化</TabsTrigger>
          <TabsTrigger value="security">安全设置</TabsTrigger>
        </TabsList>

        {children}
      </Tabs>
    </div>
  );
}
```

### 3.2 服务提供商配置组件

```typescript
// components/ai-config/ProvidersConfig.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Eye, EyeOff, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Provider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'google' | 'local';
  status: 'active' | 'inactive' | 'error';
  apiKey: string;
  endpoint?: string;
  models: string[];
  usage: {
    requests: number;
    cost: number;
    lastUsed: string;
  };
}

export function ProvidersConfig() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const { toast } = useToast();

  const handleTestConnection = async (providerId: string) => {
    try {
      // 测试API连接
      const response = await fetch(`/api/ai-config/test-provider/${providerId}`, {
        method: 'POST'
      });

      if (response.ok) {
        toast({
          title: "连接测试成功",
          description: "API服务连接正常"
        });
      } else {
        throw new Error('连接失败');
      }
    } catch (error) {
      toast({
        title: "连接测试失败",
        description: "请检查API密钥和网络连接",
        variant: "destructive"
      });
    }
  };

  const handleSaveProvider = async (provider: Partial<Provider>) => {
    try {
      const response = await fetch('/api/ai-config/providers', {
        method: provider.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(provider)
      });

      if (response.ok) {
        toast({
          title: "保存成功",
          description: "AI服务提供商配置已更新"
        });
        setEditingProvider(null);
        // 刷新列表
      }
    } catch (error) {
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 添加新提供商按钮 */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">AI服务提供商</h2>
        <Button onClick={() => setEditingProvider('new')}>
          <Plus className="w-4 h-4 mr-2" />
          添加提供商
        </Button>
      </div>

      {/* 提供商列表 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => (
          <Card key={provider.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <span>{provider.name}</span>
                  <Badge
                    variant={provider.status === 'active' ? 'default' :
                            provider.status === 'error' ? 'destructive' : 'secondary'}
                  >
                    {provider.status === 'active' ? '正常' :
                     provider.status === 'error' ? '错误' : '未激活'}
                  </Badge>
                </CardTitle>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingProvider(provider.id)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTestConnection(provider.id)}
                  >
                    <TestTube className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                类型: {provider.type.toUpperCase()} | 模型: {provider.models.length}个
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* API密钥显示 */}
              <div className="space-y-2">
                <Label>API密钥</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type={showApiKey[provider.id] ? 'text' : 'password'}
                    value={provider.apiKey}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowApiKey(prev => ({
                      ...prev,
                      [provider.id]: !prev[provider.id]
                    }))}
                  >
                    {showApiKey[provider.id] ?
                      <EyeOff className="w-4 h-4" /> :
                      <Eye className="w-4 h-4" />
                    }
                  </Button>
                </div>
              </div>

              {/* 使用统计 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">今日请求</p>
                  <p className="font-semibold">{provider.usage.requests}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">今日成本</p>
                  <p className="font-semibold">${provider.usage.cost.toFixed(2)}</p>
                </div>
              </div>

              {/* 最后使用时间 */}
              <div className="text-sm text-muted-foreground">
                最后使用: {provider.usage.lastUsed}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 添加/编辑提供商对话框 */}
      {editingProvider && (
        <ProviderEditDialog
          providerId={editingProvider}
          onSave={handleSaveProvider}
          onCancel={() => setEditingProvider(null)}
        />
      )}
    </div>
  );
}

// 提供商编辑对话框组件
function ProviderEditDialog({
  providerId,
  onSave,
  onCancel
}: {
  providerId: string;
  onSave: (provider: Partial<Provider>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'openai' as const,
    apiKey: '',
    endpoint: '',
    models: [] as string[]
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {providerId === 'new' ? '添加' : '编辑'}AI服务提供商
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">提供商名称</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="例如: OpenAI GPT-4"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">服务类型</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full p-2 border rounded-md"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic Claude</option>
              <option value="google">Google PaLM</option>
              <option value="local">本地模型</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API密钥</Label>
            <Input
              id="apiKey"
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="输入API密钥"
            />
          </div>

          {formData.type === 'local' && (
            <div className="space-y-2">
              <Label htmlFor="endpoint">API端点</Label>
              <Input
                id="endpoint"
                value={formData.endpoint}
                onChange={(e) => setFormData(prev => ({ ...prev, endpoint: e.target.value }))}
                placeholder="http://localhost:8000/v1"
              />
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button onClick={() => onSave(formData)}>
              保存
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3.3 模型配置组件

```typescript
// components/ai-config/ModelsConfig.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Save, RotateCcw, Copy, Play } from 'lucide-react';

interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  parameters: {
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
  };
  enabled: boolean;
  usage: {
    requests: number;
    avgResponseTime: number;
    successRate: number;
  };
}

export function ModelsConfig() {
  const [configs, setConfigs] = useState<ModelConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);
  const [testPrompt, setTestPrompt] = useState('');
  const [testResult, setTestResult] = useState('');

  const handleParameterChange = (configId: string, parameter: string, value: number) => {
    setConfigs(prev => prev.map(config =>
      config.id === configId
        ? {
            ...config,
            parameters: {
              ...config.parameters,
              [parameter]: value
            }
          }
        : config
    ));
  };

  const handleTestModel = async (configId: string) => {
    if (!testPrompt.trim()) return;

    try {
      const response = await fetch('/api/ai-config/test-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          configId,
          prompt: testPrompt
        })
      });

      const result = await response.json();
      setTestResult(result.response);
    } catch (error) {
      setTestResult('测试失败: ' + error.message);
    }
  };

  const handleSaveConfig = async (configId: string) => {
    const config = configs.find(c => c.id === configId);
    if (!config) return;

    try {
      await fetch(`/api/ai-config/models/${configId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      // 显示成功提示
    } catch (error) {
      // 显示错误提示
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">模型配置管理</h2>
        <Button variant="outline">
          <Copy className="w-4 h-4 mr-2" />
          导入配置模板
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧: 模型列表 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>可用模型</CardTitle>
              <CardDescription>选择要配置的AI模型</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {configs.map((config) => (
                <div
                  key={config.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedConfig === config.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedConfig(config.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{config.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {config.provider} • {config.model}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config.enabled}
                        onCheckedChange={(checked) => {
                          setConfigs(prev => prev.map(c =>
                            c.id === config.id ? { ...c, enabled: checked } : c
                          ));
                        }}
                      />
                      <Badge
                        variant={config.enabled ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {config.enabled ? '启用' : '禁用'}
                      </Badge>
                    </div>
                  </div>

                  {/* 使用统计 */}
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>
                      <p>请求数</p>
                      <p className="font-medium text-foreground">{config.usage.requests}</p>
                    </div>
                    <div>
                      <p>响应时间</p>
                      <p className="font-medium text-foreground">{config.usage.avgResponseTime}ms</p>
                    </div>
                    <div>
                      <p>成功率</p>
                      <p className="font-medium text-foreground">{config.usage.successRate}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 右侧: 配置详情 */}
        <div className="lg:col-span-2">
          {selectedConfig ? (
            <ModelConfigDetail
              config={configs.find(c => c.id === selectedConfig)!}
              onParameterChange={handleParameterChange}
              onSave={handleSaveConfig}
              onTest={handleTestModel}
              testPrompt={testPrompt}
              setTestPrompt={setTestPrompt}
              testResult={testResult}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <p className="text-muted-foreground">请选择一个模型进行配置</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// 模型配置详情组件
function ModelConfigDetail({
  config,
  onParameterChange,
  onSave,
  onTest,
  testPrompt,
  setTestPrompt,
  testResult
}: {
  config: ModelConfig;
  onParameterChange: (configId: string, parameter: string, value: number) => void;
  onSave: (configId: string) => void;
  onTest: (configId: string) => void;
  testPrompt: string;
  setTestPrompt: (prompt: string) => void;
  testResult: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{config.name}</CardTitle>
            <CardDescription>
              {config.provider} • {config.model}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              重置默认
            </Button>
            <Button size="sm" onClick={() => onSave(config.id)}>
              <Save className="w-4 h-4 mr-2" />
              保存配置
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="parameters" className="space-y-4">
          <TabsList>
            <TabsTrigger value="parameters">参数配置</TabsTrigger>
            <TabsTrigger value="test">模型测试</TabsTrigger>
            <TabsTrigger value="advanced">高级设置</TabsTrigger>
          </TabsList>

          <TabsContent value="parameters" className="space-y-6">
            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Temperature (创造性)</Label>
                <span className="text-sm text-muted-foreground">
                  {config.parameters.temperature}
                </span>
              </div>
              <Slider
                value={[config.parameters.temperature]}
                onValueChange={([value]) => onParameterChange(config.id, 'temperature', value)}
                max={2}
                min={0}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                较低值使输出更确定，较高值使输出更随机
              </p>
            </div>

            {/* Max Tokens */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Max Tokens (最大令牌数)</Label>
                <span className="text-sm text-muted-foreground">
                  {config.parameters.maxTokens}
                </span>
              </div>
              <Slider
                value={[config.parameters.maxTokens]}
                onValueChange={([value]) => onParameterChange(config.id, 'maxTokens', value)}
                max={4096}
                min={1}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                生成响应的最大长度
              </p>
            </div>

            {/* Top P */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Top P (核采样)</Label>
                <span className="text-sm text-muted-foreground">
                  {config.parameters.topP}
                </span>
              </div>
              <Slider
                value={[config.parameters.topP]}
                onValueChange={([value]) => onParameterChange(config.id, 'topP', value)}
                max={1}
                min={0}
                step={0.01}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                控制输出的多样性，建议与temperature二选一调整
              </p>
            </div>

            {/* Frequency Penalty */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Frequency Penalty (频率惩罚)</Label>
                <span className="text-sm text-muted-foreground">
                  {config.parameters.frequencyPenalty}
                </span>
              </div>
              <Slider
                value={[config.parameters.frequencyPenalty]}
                onValueChange={([value]) => onParameterChange(config.id, 'frequencyPenalty', value)}
                max={2}
                min={-2}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                减少重复内容的出现
              </p>
            </div>

            {/* Presence Penalty */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Presence Penalty (存在惩罚)</Label>
                <span className="text-sm text-muted-foreground">
                  {config.parameters.presencePenalty}
                </span>
              </div>
              <Slider
                value={[config.parameters.presencePenalty]}
                onValueChange={([value]) => onParameterChange(config.id, 'presencePenalty', value)}
                max={2}
                min={-2}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                鼓励模型谈论新话题
              </p>
            </div>
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-prompt">测试提示词</Label>
              <textarea
                id="test-prompt"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="输入测试提示词..."
                className="w-full h-32 p-3 border rounded-md resize-none"
              />
            </div>

            <Button
              onClick={() => onTest(config.id)}
              disabled={!testPrompt.trim()}
              className="w-full"
            >
              <Play className="w-4 h-4 mr-2" />
              运行测试
            </Button>

            {testResult && (
              <div className="space-y-2">
                <Label>测试结果</Label>
                <div className="p-3 bg-muted rounded-md">
                  <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>启用缓存</Label>
                  <p className="text-sm text-muted-foreground">
                    缓存相似请求以提高响应速度
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>启用流式输出</Label>
                  <p className="text-sm text-muted-foreground">
                    实时显示生成内容
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label>请求超时 (秒)</Label>
                <Input type="number" defaultValue="30" min="5" max="300" />
              </div>

              <div className="space-y-2">
                <Label>并发限制</Label>
                <Input type="number" defaultValue="10" min="1" max="100" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
```

### 3.4 状态管理

```typescript
// store/ai-config-store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AIConfigState {
  // 服务提供商状态
  providers: Provider[];
  selectedProvider: string | null;

  // 模型配置状态
  modelConfigs: ModelConfig[];
  selectedModelConfig: string | null;

  // 监控数据状态
  usageStats: {
    daily: UsageData[];
    realtime: RealtimeStats;
  };

  // 告警状态
  alerts: Alert[];
  unreadAlerts: number;

  // 加载状态
  loading: {
    providers: boolean;
    models: boolean;
    stats: boolean;
  };

  // Actions
  setProviders: (providers: Provider[]) => void;
  addProvider: (provider: Provider) => void;
  updateProvider: (id: string, updates: Partial<Provider>) => void;
  deleteProvider: (id: string) => void;

  setModelConfigs: (configs: ModelConfig[]) => void;
  updateModelConfig: (id: string, updates: Partial<ModelConfig>) => void;

  setUsageStats: (stats: any) => void;
  updateRealtimeStats: (stats: RealtimeStats) => void;

  addAlert: (alert: Alert) => void;
  markAlertAsRead: (id: string) => void;

  setLoading: (key: keyof AIConfigState['loading'], value: boolean) => void;
}

export const useAIConfigStore = create<AIConfigState>()(
  devtools((set, get) => ({
    // 初始状态
    providers: [],
    selectedProvider: null,
    modelConfigs: [],
    selectedModelConfig: null,
    usageStats: {
      daily: [],
      realtime: {
        activeRequests: 0,
        requestsPerMinute: 0,
        averageLatency: 0,
        errorRate: 0
      }
    },
    alerts: [],
    unreadAlerts: 0,
    loading: {
      providers: false,
      models: false,
      stats: false
    },

    // Actions
    setProviders: (providers) => set({ providers }),

    addProvider: (provider) =>
      set((state) => ({
        providers: [...state.providers, provider]
      })),

    updateProvider: (id, updates) =>
      set((state) => ({
        providers: state.providers.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        )
      })),

    deleteProvider: (id) =>
      set((state) => ({
        providers: state.providers.filter((p) => p.id !== id)
      })),

    setModelConfigs: (configs) => set({ modelConfigs: configs }),

    updateModelConfig: (id, updates) =>
      set((state) => ({
        modelConfigs: state.modelConfigs.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        )
      })),

    setUsageStats: (stats) => set({ usageStats: stats }),

    updateRealtimeStats: (stats) =>
      set((state) => ({
        usageStats: {
          ...state.usageStats,
          realtime: stats
        }
      })),

    addAlert: (alert) =>
      set((state) => ({
        alerts: [alert, ...state.alerts],
        unreadAlerts: state.unreadAlerts + 1
      })),

    markAlertAsRead: (id) =>
      set((state) => ({
        alerts: state.alerts.map((a) =>
          a.id === id ? { ...a, read: true } : a
        ),
        unreadAlerts: Math.max(0, state.unreadAlerts - 1)
      })),

    setLoading: (key, value) =>
      set((state) => ({
        loading: {
          ...state.loading,
          [key]: value
        }
      }))
  }))
);

// 类型定义
interface Provider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'google' | 'local';
  status: 'active' | 'inactive' | 'error';
  apiKey: string;
  endpoint?: string;
  models: string[];
  usage: {
    requests: number;
    cost: number;
    lastUsed: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  parameters: {
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
  };
  enabled: boolean;
  usage: {
    requests: number;
    avgResponseTime: number;
    successRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface UsageData {
  date: string;
  requests: number;
  cost: number;
  latency: number;
  errors: number;
}

interface RealtimeStats {
  activeRequests: number;
  requestsPerMinute: number;
  averageLatency: number;
  errorRate: number;
}

interface Alert {
  id: string;
  type: 'cost' | 'error' | 'performance' | 'quota';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
```

## 4. 后端API设计

### 4.1 服务提供商管理接口

```typescript
// app/api/ai-config/providers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/encryption';

// 获取所有AI服务提供商
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 检查权限
    if (!user.permissions.includes('ai_config_read')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const providers = await prisma.aiProvider.findMany({
      include: {
        usage: {
          where: {
            date: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 最近24小时
            }
          }
        }
      }
    });

    // 解密API密钥（仅显示部分）
    const providersWithMaskedKeys = providers.map((provider) => ({
      ...provider,
      apiKey: maskApiKey(decrypt(provider.encryptedApiKey)),
      encryptedApiKey: undefined // 不返回加密的密钥
    }));

    return NextResponse.json(providersWithMaskedKeys);
  } catch (error) {
    console.error('获取AI提供商失败:', error);
    return NextResponse.json({ error: '获取AI提供商失败' }, { status: 500 });
  }
}

// 创建新的AI服务提供商
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.permissions.includes('ai_config_write')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const body = await request.json();
    const { name, type, apiKey, endpoint, models } = body;

    // 验证必填字段
    if (!name || !type || !apiKey) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    // 测试API连接
    const isValid = await testProviderConnection(type, apiKey, endpoint);
    if (!isValid) {
      return NextResponse.json({ error: 'API连接测试失败' }, { status: 400 });
    }

    // 加密API密钥
    const encryptedApiKey = encrypt(apiKey);

    const provider = await prisma.aiProvider.create({
      data: {
        name,
        type,
        encryptedApiKey,
        endpoint,
        models: models || [],
        status: 'active',
        createdBy: user.id
      }
    });

    // 记录操作日志
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_AI_PROVIDER',
        resourceType: 'AI_PROVIDER',
        resourceId: provider.id,
        userId: user.id,
        details: { name, type }
      }
    });

    return NextResponse.json({
      ...provider,
      apiKey: maskApiKey(apiKey),
      encryptedApiKey: undefined
    });
  } catch (error) {
    console.error('创建AI提供商失败:', error);
    return NextResponse.json({ error: '创建AI提供商失败' }, { status: 500 });
  }
}

// 更新AI服务提供商
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.permissions.includes('ai_config_write')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, apiKey, endpoint, models, enabled } = body;

    const updateData: any = {
      name,
      endpoint,
      models,
      enabled,
      updatedAt: new Date()
    };

    // 如果提供了新的API密钥，则加密存储
    if (apiKey && !apiKey.includes('***')) {
      const isValid = await testProviderConnection(body.type, apiKey, endpoint);
      if (!isValid) {
        return NextResponse.json({ error: 'API连接测试失败' }, { status: 400 });
      }
      updateData.encryptedApiKey = encrypt(apiKey);
    }

    const provider = await prisma.aiProvider.update({
      where: { id },
      data: updateData
    });

    // 记录操作日志
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_AI_PROVIDER',
        resourceType: 'AI_PROVIDER',
        resourceId: id,
        userId: user.id,
        details: { name }
      }
    });

    return NextResponse.json({
      ...provider,
      apiKey: maskApiKey(apiKey || ''),
      encryptedApiKey: undefined
    });
  } catch (error) {
    console.error('更新AI提供商失败:', error);
    return NextResponse.json({ error: '更新AI提供商失败' }, { status: 500 });
  }
}

// 辅助函数
function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return '***';
  return apiKey.slice(0, 4) + '***' + apiKey.slice(-4);
}

async function testProviderConnection(
  type: string,
  apiKey: string,
  endpoint?: string
): Promise<boolean> {
  try {
    switch (type) {
      case 'openai':
        return await testOpenAIConnection(apiKey);
      case 'anthropic':
        return await testAnthropicConnection(apiKey);
      case 'local':
        return await testLocalConnection(endpoint!, apiKey);
      default:
        return false;
    }
  } catch (error) {
    console.error('测试连接失败:', error);
    return false;
  }
}

async function testOpenAIConnection(apiKey: string): Promise<boolean> {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });
  return response.ok;
}

async function testAnthropicConnection(apiKey: string): Promise<boolean> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1,
      messages: [{ role: 'user', content: 'test' }]
    })
  });
  return response.status !== 401; // 401表示认证失败
}

async function testLocalConnection(
  endpoint: string,
  apiKey: string
): Promise<boolean> {
  const response = await fetch(`${endpoint}/models`, {
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });
  return response.ok;
}
```

### 4.2 模型配置管理接口

```typescript
// app/api/ai-config/models/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';

// 获取所有模型配置
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.permissions.includes('ai_config_read')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    const where = providerId ? { providerId } : {};

    const modelConfigs = await prisma.aiModelConfig.findMany({
      where,
      include: {
        provider: true,
        usage: {
          where: {
            date: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 最近7天
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(modelConfigs);
  } catch (error) {
    console.error('获取模型配置失败:', error);
    return NextResponse.json({ error: '获取模型配置失败' }, { status: 500 });
  }
}

// 创建新的模型配置
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.permissions.includes('ai_config_write')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const body = await request.json();
    const { name, providerId, model, parameters, enabled = true } = body;

    // 验证必填字段
    if (!name || !providerId || !model || !parameters) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    // 验证参数范围
    const validationError = validateModelParameters(parameters);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const modelConfig = await prisma.aiModelConfig.create({
      data: {
        name,
        providerId,
        model,
        parameters,
        enabled,
        createdBy: user.id
      },
      include: {
        provider: true
      }
    });

    // 记录操作日志
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_MODEL_CONFIG',
        resourceType: 'AI_MODEL_CONFIG',
        resourceId: modelConfig.id,
        userId: user.id,
        details: { name, model }
      }
    });

    return NextResponse.json(modelConfig);
  } catch (error) {
    console.error('创建模型配置失败:', error);
    return NextResponse.json({ error: '创建模型配置失败' }, { status: 500 });
  }
}

// 验证模型参数
function validateModelParameters(parameters: any): string | null {
  const { temperature, maxTokens, topP, frequencyPenalty, presencePenalty } =
    parameters;

  if (temperature < 0 || temperature > 2) {
    return 'Temperature必须在0-2之间';
  }

  if (maxTokens < 1 || maxTokens > 4096) {
    return 'Max Tokens必须在1-4096之间';
  }

  if (topP < 0 || topP > 1) {
    return 'Top P必须在0-1之间';
  }

  if (frequencyPenalty < -2 || frequencyPenalty > 2) {
    return 'Frequency Penalty必须在-2到2之间';
  }

  if (presencePenalty < -2 || presencePenalty > 2) {
    return 'Presence Penalty必须在-2到2之间';
  }

  return null;
}
```

### 4.3 使用统计接口

```typescript
// app/api/ai-config/usage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';

// 获取使用统计数据
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.permissions.includes('ai_config_read')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    const providerId = searchParams.get('providerId');
    const projectId = searchParams.get('projectId');

    // 计算时间范围
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case '1d':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    // 构建查询条件
    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    if (providerId) {
      where.providerId = providerId;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    // 获取使用统计
    const usageStats = await prisma.aiUsage.groupBy({
      by: ['date', 'providerId'],
      where,
      _sum: {
        requests: true,
        tokens: true,
        cost: true
      },
      _avg: {
        latency: true
      },
      _count: {
        errors: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    // 获取实时统计
    const realtimeStats = await getRealtimeStats(providerId, projectId);

    // 获取成本分析
    const costAnalysis = await getCostAnalysis(
      startDate,
      endDate,
      providerId,
      projectId
    );

    return NextResponse.json({
      timeRange,
      usageStats,
      realtimeStats,
      costAnalysis
    });
  } catch (error) {
    console.error('获取使用统计失败:', error);
    return NextResponse.json({ error: '获取使用统计失败' }, { status: 500 });
  }
}

// 获取实时统计数据
async function getRealtimeStats(providerId?: string, projectId?: string) {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const where: any = {
    createdAt: {
      gte: oneMinuteAgo
    }
  };

  if (providerId) where.providerId = providerId;
  if (projectId) where.projectId = projectId;

  const [activeRequests, recentRequests, avgLatency, errorCount] =
    await Promise.all([
      // 当前活跃请求数
      prisma.aiRequest.count({
        where: {
          ...where,
          status: 'processing'
        }
      }),

      // 最近一分钟请求数
      prisma.aiRequest.count({ where }),

      // 平均延迟
      prisma.aiRequest.aggregate({
        where: {
          ...where,
          status: 'completed'
        },
        _avg: {
          latency: true
        }
      }),

      // 错误数
      prisma.aiRequest.count({
        where: {
          ...where,
          status: 'error'
        }
      })
    ]);

  return {
    activeRequests,
    requestsPerMinute: recentRequests,
    averageLatency: avgLatency._avg.latency || 0,
    errorRate: recentRequests > 0 ? (errorCount / recentRequests) * 100 : 0
  };
}

// 获取成本分析
async function getCostAnalysis(
  startDate: Date,
  endDate: Date,
  providerId?: string,
  projectId?: string
) {
  const where: any = {
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  };

  if (providerId) where.providerId = providerId;
  if (projectId) where.projectId = projectId;

  const [totalCost, costByProvider, costByProject, costTrend] =
    await Promise.all([
      // 总成本
      prisma.aiUsage.aggregate({
        where,
        _sum: {
          cost: true
        }
      }),

      // 按提供商分组的成本
      prisma.aiUsage.groupBy({
        by: ['providerId'],
        where,
        _sum: {
          cost: true,
          requests: true
        }
      }),

      // 按项目分组的成本
      prisma.aiUsage.groupBy({
        by: ['projectId'],
        where,
        _sum: {
          cost: true,
          requests: true
        }
      }),

      // 成本趋势
      prisma.aiUsage.groupBy({
        by: ['date'],
        where,
        _sum: {
          cost: true
        },
        orderBy: {
          date: 'asc'
        }
      })
    ]);

  return {
    totalCost: totalCost._sum.cost || 0,
    costByProvider,
    costByProject,
    costTrend
  };
}
```

### 4.4 模型测试接口

```typescript
// app/api/ai-config/test-model/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
import { AIModelService } from '@/lib/ai/model-service';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.permissions.includes('ai_config_test')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { configId, prompt } = await request.json();

    if (!configId || !prompt) {
      return NextResponse.json({ error: '缺少必填参数' }, { status: 400 });
    }

    // 获取模型配置
    const config = await prisma.aiModelConfig.findUnique({
      where: { id: configId },
      include: { provider: true }
    });

    if (!config) {
      return NextResponse.json({ error: '模型配置不存在' }, { status: 404 });
    }

    // 创建AI模型服务实例
    const modelService = new AIModelService(config);

    const startTime = Date.now();

    try {
      // 执行测试
      const response = await modelService.generateResponse(prompt);
      const latency = Date.now() - startTime;

      // 记录测试结果
      await prisma.aiTestResult.create({
        data: {
          configId,
          prompt,
          response,
          latency,
          success: true,
          userId: user.id
        }
      });

      return NextResponse.json({
        response,
        latency,
        success: true
      });
    } catch (error) {
      const latency = Date.now() - startTime;

      // 记录失败结果
      await prisma.aiTestResult.create({
        data: {
          configId,
          prompt,
          response: null,
          latency,
          success: false,
          error: error.message,
          userId: user.id
        }
      });

      return NextResponse.json({
        error: error.message,
        latency,
        success: false
      });
    }
  } catch (error) {
    console.error('模型测试失败:', error);
    return NextResponse.json({ error: '模型测试失败' }, { status: 500 });
  }
}
```

## 5. LangChain集成

### 5.1 AI模型服务类

```typescript
// lib/ai/model-service.ts
import { OpenAI } from 'langchain/llms/openai';
import { ChatAnthropic } from 'langchain/chat_models/anthropic';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { BaseLanguageModel } from 'langchain/base_language';
import { decrypt } from '@/lib/encryption';

export class AIModelService {
  private model: BaseLanguageModel;
  private config: any;

  constructor(config: any) {
    this.config = config;
    this.model = this.createModel();
  }

  private createModel(): BaseLanguageModel {
    const { provider, model, parameters } = this.config;
    const apiKey = decrypt(provider.encryptedApiKey);

    switch (provider.type) {
      case 'openai':
        return new ChatOpenAI({
          openAIApiKey: apiKey,
          modelName: model,
          temperature: parameters.temperature,
          maxTokens: parameters.maxTokens,
          topP: parameters.topP,
          frequencyPenalty: parameters.frequencyPenalty,
          presencePenalty: parameters.presencePenalty
        });

      case 'anthropic':
        return new ChatAnthropic({
          anthropicApiKey: apiKey,
          modelName: model,
          temperature: parameters.temperature,
          maxTokens: parameters.maxTokens,
          topP: parameters.topP
        });

      case 'local':
        return new OpenAI({
          openAIApiKey: apiKey,
          basePath: provider.endpoint,
          modelName: model,
          temperature: parameters.temperature,
          maxTokens: parameters.maxTokens
        });

      default:
        throw new Error(`不支持的提供商类型: ${provider.type}`);
    }
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const response = await this.model.call(prompt);
      return response;
    } catch (error) {
      console.error('AI模型调用失败:', error);
      throw new Error(`模型调用失败: ${error.message}`);
    }
  }

  async generateStreamResponse(
    prompt: string,
    onToken: (token: string) => void
  ): Promise<string> {
    try {
      let fullResponse = '';

      const stream = await this.model.stream(prompt);

      for await (const chunk of stream) {
        const token = chunk.content || chunk;
        fullResponse += token;
        onToken(token);
      }

      return fullResponse;
    } catch (error) {
      console.error('AI模型流式调用失败:', error);
      throw new Error(`流式调用失败: ${error.message}`);
    }
  }

  getModelInfo() {
    return {
      provider: this.config.provider.name,
      model: this.config.model,
      parameters: this.config.parameters
    };
  }
}
```

### 5.2 模型管理器

```typescript
// lib/ai/model-manager.ts
import { AIModelService } from './model-service';
import { prisma } from '@/lib/prisma';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export class AIModelManager {
  private static instance: AIModelManager;
  private modelCache: Map<string, AIModelService> = new Map();
  private loadBalancer: Map<string, number> = new Map();

  static getInstance(): AIModelManager {
    if (!AIModelManager.instance) {
      AIModelManager.instance = new AIModelManager();
    }
    return AIModelManager.instance;
  }

  async getModel(configId: string): Promise<AIModelService> {
    // 检查缓存
    if (this.modelCache.has(configId)) {
      return this.modelCache.get(configId)!;
    }

    // 从数据库加载配置
    const config = await prisma.aiModelConfig.findUnique({
      where: { id: configId },
      include: { provider: true }
    });

    if (!config || !config.enabled) {
      throw new Error('模型配置不存在或已禁用');
    }

    // 创建模型服务
    const modelService = new AIModelService(config);

    // 缓存模型服务
    this.modelCache.set(configId, modelService);

    return modelService;
  }

  async getOptimalModel(
    scenario: string,
    requirements?: {
      maxLatency?: number;
      maxCost?: number;
      minQuality?: number;
    }
  ): Promise<AIModelService> {
    // 获取适合场景的模型配置
    const configs = await prisma.aiModelConfig.findMany({
      where: {
        enabled: true,
        scenarios: {
          has: scenario
        }
      },
      include: {
        provider: true,
        usage: {
          where: {
            date: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        }
      }
    });

    if (configs.length === 0) {
      throw new Error('没有可用的模型配置');
    }

    // 根据要求筛选和排序
    let filteredConfigs = configs;

    if (requirements) {
      filteredConfigs = configs.filter((config) => {
        const avgLatency = this.calculateAverageLatency(config.usage);
        const avgCost = this.calculateAverageCost(config.usage);
        const quality = config.qualityScore || 0;

        return (
          (!requirements.maxLatency || avgLatency <= requirements.maxLatency) &&
          (!requirements.maxCost || avgCost <= requirements.maxCost) &&
          (!requirements.minQuality || quality >= requirements.minQuality)
        );
      });
    }

    if (filteredConfigs.length === 0) {
      throw new Error('没有满足要求的模型配置');
    }

    // 负载均衡选择
    const selectedConfig = this.selectWithLoadBalancing(filteredConfigs);

    return await this.getModel(selectedConfig.id);
  }

  private calculateAverageLatency(usage: any[]): number {
    if (usage.length === 0) return 0;
    const totalLatency = usage.reduce((sum, u) => sum + (u.avgLatency || 0), 0);
    return totalLatency / usage.length;
  }

  private calculateAverageCost(usage: any[]): number {
    if (usage.length === 0) return 0;
    const totalCost = usage.reduce((sum, u) => sum + (u.cost || 0), 0);
    const totalRequests = usage.reduce((sum, u) => sum + (u.requests || 0), 0);
    return totalRequests > 0 ? totalCost / totalRequests : 0;
  }

  private selectWithLoadBalancing(configs: any[]): any {
    // 简单的轮询负载均衡
    const configIds = configs.map((c) => c.id);

    for (const configId of configIds) {
      if (!this.loadBalancer.has(configId)) {
        this.loadBalancer.set(configId, 0);
      }
    }

    // 找到使用次数最少的配置
    let minUsage = Infinity;
    let selectedConfig = configs[0];

    for (const config of configs) {
      const usage = this.loadBalancer.get(config.id) || 0;
      if (usage < minUsage) {
        minUsage = usage;
        selectedConfig = config;
      }
    }

    // 增加使用计数
    this.loadBalancer.set(selectedConfig.id, minUsage + 1);

    return selectedConfig;
  }

  async recordUsage(
    configId: string,
    usage: {
      requests: number;
      tokens: number;
      cost: number;
      latency: number;
      success: boolean;
    }
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    await prisma.aiUsage.upsert({
      where: {
        configId_date: {
          configId,
          date: today
        }
      },
      update: {
        requests: {
          increment: usage.requests
        },
        tokens: {
          increment: usage.tokens
        },
        cost: {
          increment: usage.cost
        },
        avgLatency: usage.latency,
        errors: usage.success
          ? undefined
          : {
              increment: 1
            }
      },
      create: {
        configId,
        date: today,
        requests: usage.requests,
        tokens: usage.tokens,
        cost: usage.cost,
        avgLatency: usage.latency,
        errors: usage.success ? 0 : 1
      }
    });

    // 缓存到Redis用于实时统计
    await redis.hincrby(
      `ai:usage:${configId}:${today}`,
      'requests',
      usage.requests
    );
    await redis.hincrby(
      `ai:usage:${configId}:${today}`,
      'tokens',
      usage.tokens
    );
    await redis.hincrbyfloat(
      `ai:usage:${configId}:${today}`,
      'cost',
      usage.cost
    );
  }

  clearCache(): void {
    this.modelCache.clear();
    this.loadBalancer.clear();
  }

  async refreshConfig(configId: string): Promise<void> {
    this.modelCache.delete(configId);
    await this.getModel(configId);
  }
}
```

## 6. 数据库设计

### 6.1 数据库表结构

```sql
-- AI服务提供商表
CREATE TABLE ai_providers (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('openai', 'anthropic', 'google', 'azure', 'local') NOT NULL,
  endpoint VARCHAR(255),
  encrypted_api_key TEXT,
  rate_limit_per_minute INT DEFAULT 60,
  rate_limit_per_day INT DEFAULT 1000,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(36),
  INDEX idx_type (type),
  INDEX idx_enabled (enabled)
);

-- AI模型配置表
CREATE TABLE ai_model_configs (
  id VARCHAR(36) PRIMARY KEY,
  provider_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  description TEXT,
  scenarios JSON, -- ['chat', 'code_review', 'analysis', 'knowledge']
  parameters JSON, -- {temperature, maxTokens, topP, etc.}
  cost_per_1k_tokens DECIMAL(10, 6),
  quality_score DECIMAL(3, 2), -- 0.00-1.00
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(36),
  FOREIGN KEY (provider_id) REFERENCES ai_providers(id) ON DELETE CASCADE,
  INDEX idx_provider_id (provider_id),
  INDEX idx_enabled (enabled),
  INDEX idx_scenarios ((CAST(scenarios AS CHAR(255) ARRAY)))
);

-- AI使用统计表
CREATE TABLE ai_usage (
  id VARCHAR(36) PRIMARY KEY,
  config_id VARCHAR(36) NOT NULL,
  provider_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36),
  date DATE NOT NULL,
  requests INT DEFAULT 0,
  tokens INT DEFAULT 0,
  cost DECIMAL(10, 6) DEFAULT 0,
  avg_latency INT DEFAULT 0, -- 毫秒
  errors INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (config_id) REFERENCES ai_model_configs(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES ai_providers(id) ON DELETE CASCADE,
  UNIQUE KEY uk_config_date (config_id, date),
  INDEX idx_provider_date (provider_id, date),
  INDEX idx_project_date (project_id, date)
);

-- AI请求记录表
CREATE TABLE ai_requests (
  id VARCHAR(36) PRIMARY KEY,
  config_id VARCHAR(36) NOT NULL,
  provider_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36),
  user_id VARCHAR(36),
  prompt_tokens INT,
  completion_tokens INT,
  total_tokens INT,
  cost DECIMAL(10, 6),
  latency INT, -- 毫秒
  status ENUM('processing', 'completed', 'error') DEFAULT 'processing',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (config_id) REFERENCES ai_model_configs(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES ai_providers(id) ON DELETE CASCADE,
  INDEX idx_config_created (config_id, created_at),
  INDEX idx_provider_created (provider_id, created_at),
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_status (status)
);

-- AI测试结果表
CREATE TABLE ai_test_results (
  id VARCHAR(36) PRIMARY KEY,
  config_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT,
  latency INT, -- 毫秒
  success BOOLEAN NOT NULL,
  error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (config_id) REFERENCES ai_model_configs(id) ON DELETE CASCADE,
  INDEX idx_config_created (config_id, created_at),
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_success (success)
);

-- AI配置变更历史表
CREATE TABLE ai_config_history (
  id VARCHAR(36) PRIMARY KEY,
  config_id VARCHAR(36) NOT NULL,
  field_name VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by VARCHAR(36) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (config_id) REFERENCES ai_model_configs(id) ON DELETE CASCADE,
  INDEX idx_config_changed (config_id, changed_at),
  INDEX idx_changed_by (changed_by)
);
```

### 6.2 数据访问层

```typescript
// lib/dao/ai-config-dao.ts
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/encryption';

export class AIConfigDAO {
  // 创建AI服务提供商
  async createProvider(data: {
    name: string;
    type: string;
    endpoint?: string;
    apiKey: string;
    rateLimitPerMinute?: number;
    rateLimitPerDay?: number;
    createdBy: string;
  }) {
    const encryptedApiKey = encrypt(data.apiKey);

    return await prisma.aiProvider.create({
      data: {
        name: data.name,
        type: data.type,
        endpoint: data.endpoint,
        encryptedApiKey,
        rateLimitPerMinute: data.rateLimitPerMinute || 60,
        rateLimitPerDay: data.rateLimitPerDay || 1000,
        createdBy: data.createdBy
      }
    });
  }

  // 更新AI服务提供商
  async updateProvider(id: string, data: any, userId: string) {
    const updateData: any = { ...data };

    if (data.apiKey) {
      updateData.encryptedApiKey = encrypt(data.apiKey);
      delete updateData.apiKey;
    }

    return await prisma.aiProvider.update({
      where: { id },
      data: updateData
    });
  }

  // 获取AI服务提供商列表
  async getProviders(enabled?: boolean) {
    const where = enabled !== undefined ? { enabled } : {};

    const providers = await prisma.aiProvider.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        endpoint: true,
        rateLimitPerMinute: true,
        rateLimitPerDay: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
        // 不返回加密的API密钥
        encryptedApiKey: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return providers;
  }

  // 创建模型配置
  async createModelConfig(data: {
    providerId: string;
    name: string;
    model: string;
    description?: string;
    scenarios: string[];
    parameters: any;
    costPer1kTokens?: number;
    qualityScore?: number;
    createdBy: string;
  }) {
    return await prisma.aiModelConfig.create({
      data: {
        providerId: data.providerId,
        name: data.name,
        model: data.model,
        description: data.description,
        scenarios: data.scenarios,
        parameters: data.parameters,
        costPer1kTokens: data.costPer1kTokens,
        qualityScore: data.qualityScore,
        createdBy: data.createdBy
      },
      include: {
        provider: true
      }
    });
  }

  // 更新模型配置
  async updateModelConfig(id: string, data: any, userId: string) {
    // 记录变更历史
    const currentConfig = await prisma.aiModelConfig.findUnique({
      where: { id }
    });

    if (currentConfig) {
      const changes = [];
      for (const [key, value] of Object.entries(data)) {
        if (currentConfig[key] !== value) {
          changes.push({
            configId: id,
            fieldName: key,
            oldValue: JSON.stringify(currentConfig[key]),
            newValue: JSON.stringify(value),
            changedBy: userId
          });
        }
      }

      if (changes.length > 0) {
        await prisma.aiConfigHistory.createMany({
          data: changes
        });
      }
    }

    return await prisma.aiModelConfig.update({
      where: { id },
      data,
      include: {
        provider: true
      }
    });
  }

  // 获取模型配置列表
  async getModelConfigs(filters?: {
    providerId?: string;
    enabled?: boolean;
    scenarios?: string[];
  }) {
    const where: any = {};

    if (filters?.providerId) {
      where.providerId = filters.providerId;
    }

    if (filters?.enabled !== undefined) {
      where.enabled = filters.enabled;
    }

    if (filters?.scenarios && filters.scenarios.length > 0) {
      where.scenarios = {
        hasSome: filters.scenarios
      };
    }

    return await prisma.aiModelConfig.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            type: true,
            enabled: true
          }
        },
        usage: {
          where: {
            date: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          },
          orderBy: {
            date: 'desc'
          },
          take: 7
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  // 获取使用统计
  async getUsageStats(filters: {
    startDate: Date;
    endDate: Date;
    providerId?: string;
    configId?: string;
    projectId?: string;
  }) {
    const where: any = {
      date: {
        gte: filters.startDate,
        lte: filters.endDate
      }
    };

    if (filters.providerId) where.providerId = filters.providerId;
    if (filters.configId) where.configId = filters.configId;
    if (filters.projectId) where.projectId = filters.projectId;

    const [totalStats, dailyStats, providerStats] = await Promise.all([
      // 总统计
      prisma.aiUsage.aggregate({
        where,
        _sum: {
          requests: true,
          tokens: true,
          cost: true,
          errors: true
        },
        _avg: {
          avgLatency: true
        }
      }),

      // 按日统计
      prisma.aiUsage.groupBy({
        by: ['date'],
        where,
        _sum: {
          requests: true,
          tokens: true,
          cost: true,
          errors: true
        },
        orderBy: {
          date: 'asc'
        }
      }),

      // 按提供商统计
      prisma.aiUsage.groupBy({
        by: ['providerId'],
        where,
        _sum: {
          requests: true,
          tokens: true,
          cost: true,
          errors: true
        },
        _avg: {
          avgLatency: true
        }
      })
    ]);

    return {
      total: totalStats,
      daily: dailyStats,
      byProvider: providerStats
    };
  }

  // 记录AI请求
  async recordRequest(data: {
    configId: string;
    providerId: string;
    projectId?: string;
    userId?: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
    latency: number;
    status: 'completed' | 'error';
    errorMessage?: string;
  }) {
    return await prisma.aiRequest.create({
      data: {
        ...data,
        completedAt: new Date()
      }
    });
  }

  // 删除提供商
  async deleteProvider(id: string) {
    return await prisma.aiProvider.delete({
      where: { id }
    });
  }

  // 删除模型配置
  async deleteModelConfig(id: string) {
    return await prisma.aiModelConfig.delete({
      where: { id }
    });
  }

  // 获取配置变更历史
  async getConfigHistory(configId: string, limit = 50) {
    return await prisma.aiConfigHistory.findMany({
      where: { configId },
      orderBy: {
        changedAt: 'desc'
      },
      take: limit,
      include: {
        changedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }
}
```

## 7. 性能优化

### 7.1 前端性能优化

```typescript
// hooks/use-ai-config-optimization.ts
import { useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export function useAIConfigOptimization() {
  // 虚拟化大列表
  const useVirtualizedList = (
    parentRef: React.RefObject<HTMLElement>,
    items: any[]
  ) => {
    return useVirtualizer({
      count: items.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 80,
      overscan: 5
    });
  };

  // 防抖搜索
  const useDebouncedSearch = (searchTerm: string, delay = 300) => {
    return useMemo(() => {
      const timeoutId = setTimeout(() => {
        return searchTerm;
      }, delay);

      return () => clearTimeout(timeoutId);
    }, [searchTerm, delay]);
  };

  // 缓存计算结果
  const useMemoizedStats = (usage: any[]) => {
    return useMemo(() => {
      if (!usage || usage.length === 0) {
        return {
          totalRequests: 0,
          totalCost: 0,
          averageLatency: 0,
          errorRate: 0
        };
      }

      const totalRequests = usage.reduce(
        (sum, u) => sum + (u.requests || 0),
        0
      );
      const totalCost = usage.reduce((sum, u) => sum + (u.cost || 0), 0);
      const totalLatency = usage.reduce(
        (sum, u) => sum + (u.avgLatency || 0),
        0
      );
      const totalErrors = usage.reduce((sum, u) => sum + (u.errors || 0), 0);

      return {
        totalRequests,
        totalCost,
        averageLatency: usage.length > 0 ? totalLatency / usage.length : 0,
        errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0
      };
    }, [usage]);
  };

  // 批量操作优化
  const useBatchOperations = () => {
    const [pendingOperations, setPendingOperations] = useState<any[]>([]);

    const addOperation = useCallback((operation: any) => {
      setPendingOperations((prev) => [...prev, operation]);
    }, []);

    const executeBatch = useCallback(async () => {
      if (pendingOperations.length === 0) return;

      try {
        await Promise.all(pendingOperations.map((op) => op()));
        setPendingOperations([]);
      } catch (error) {
        console.error('批量操作失败:', error);
      }
    }, [pendingOperations]);

    return {
      addOperation,
      executeBatch,
      pendingCount: pendingOperations.length
    };
  };

  return {
    useVirtualizedList,
    useDebouncedSearch,
    useMemoizedStats,
    useBatchOperations
  };
}
```

### 7.2 后端性能优化

```typescript
// lib/cache/ai-config-cache.ts
import { Redis } from 'ioredis';
import { AIConfigDAO } from '@/lib/dao/ai-config-dao';

const redis = new Redis(process.env.REDIS_URL!);
const configDAO = new AIConfigDAO();

export class AIConfigCache {
  private static readonly CACHE_TTL = 300; // 5分钟
  private static readonly CACHE_PREFIX = 'ai:config:';

  // 缓存模型配置
  static async getModelConfigs(filters?: any): Promise<any[]> {
    const cacheKey = `${this.CACHE_PREFIX}models:${JSON.stringify(filters || {})}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const configs = await configDAO.getModelConfigs(filters);
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(configs));

      return configs;
    } catch (error) {
      console.error('缓存获取失败，直接查询数据库:', error);
      return await configDAO.getModelConfigs(filters);
    }
  }

  // 缓存提供商列表
  static async getProviders(enabled?: boolean): Promise<any[]> {
    const cacheKey = `${this.CACHE_PREFIX}providers:${enabled || 'all'}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const providers = await configDAO.getProviders(enabled);
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(providers));

      return providers;
    } catch (error) {
      console.error('缓存获取失败，直接查询数据库:', error);
      return await configDAO.getProviders(enabled);
    }
  }

  // 缓存使用统计
  static async getUsageStats(filters: any): Promise<any> {
    const cacheKey = `${this.CACHE_PREFIX}stats:${JSON.stringify(filters)}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const stats = await configDAO.getUsageStats(filters);
      await redis.setex(cacheKey, 60, JSON.stringify(stats)); // 1分钟缓存

      return stats;
    } catch (error) {
      console.error('缓存获取失败，直接查询数据库:', error);
      return await configDAO.getUsageStats(filters);
    }
  }

  // 清除相关缓存
  static async invalidateCache(type: 'models' | 'providers' | 'stats' | 'all') {
    try {
      const pattern =
        type === 'all'
          ? `${this.CACHE_PREFIX}*`
          : `${this.CACHE_PREFIX}${type}:*`;

      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('缓存清除失败:', error);
    }
  }

  // 预热缓存
  static async warmupCache() {
    try {
      await Promise.all([
        this.getProviders(true),
        this.getModelConfigs({ enabled: true }),
        this.getUsageStats({
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date()
        })
      ]);
    } catch (error) {
      console.error('缓存预热失败:', error);
    }
  }
}
```

## 8. 错误处理和监控

### 8.1 错误处理

```typescript
// components/error-boundary.tsx
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class AIConfigErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AI配置页面错误:', error, errorInfo);

    // 发送错误报告
    this.reportError(error, errorInfo);

    this.setState({
      error,
      errorInfo
    });
  }

  private reportError(error: Error, errorInfo: React.ErrorInfo) {
    // 发送到监控服务
    fetch('/api/monitoring/error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        errorInfo,
        timestamp: new Date().toISOString(),
        page: 'ai-config',
        userAgent: navigator.userAgent
      })
    }).catch(console.error);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="mt-2">
              <div className="space-y-2">
                <p>AI配置页面遇到了错误，请稍后重试。</p>
                {this.state.error && (
                  <details className="text-sm text-muted-foreground">
                    <summary>错误详情</summary>
                    <pre className="mt-2 text-xs overflow-auto">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
                <Button
                  onClick={this.handleRetry}
                  size="sm"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重试
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 8.2 API错误处理

```typescript
// lib/api-error-handler.ts
import { NextResponse } from 'next/server';

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: any) {
  console.error('API错误:', error);

  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code
      },
      { status: error.statusCode }
    );
  }

  if (error.code === 'P2002') {
    return NextResponse.json(
      {
        error: '数据已存在，请检查唯一性约束',
        code: 'DUPLICATE_ENTRY'
      },
      { status: 409 }
    );
  }

  if (error.code === 'P2025') {
    return NextResponse.json(
      {
        error: '记录不存在',
        code: 'NOT_FOUND'
      },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      error: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    },
    { status: 500 }
  );
}

// API路由中间件
export function withErrorHandler(handler: Function) {
  return async (request: Request, context?: any) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleAPIError(error);
    }
  };
}
```

### 8.3 监控指标

```typescript
// lib/monitoring/ai-config-metrics.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export class AIConfigMetrics {
  // 记录页面访问
  static async recordPageView(userId?: string) {
    const today = new Date().toISOString().split('T')[0];

    await Promise.all([
      redis.incr(`metrics:ai_config:page_views:${today}`),
      userId && redis.sadd(`metrics:ai_config:unique_users:${today}`, userId)
    ]);
  }

  // 记录配置操作
  static async recordConfigOperation(
    operation: 'create' | 'update' | 'delete' | 'test',
    type: 'provider' | 'model',
    success: boolean,
    latency?: number
  ) {
    const today = new Date().toISOString().split('T')[0];
    const key = `metrics:ai_config:operations:${today}`;

    await Promise.all([
      redis.hincrby(key, `${operation}_${type}_total`, 1),
      redis.hincrby(
        key,
        `${operation}_${type}_${success ? 'success' : 'error'}`,
        1
      ),
      latency &&
        redis.lpush(`metrics:ai_config:latency:${operation}_${type}`, latency)
    ]);
  }

  // 记录API调用
  static async recordAPICall(
    endpoint: string,
    method: string,
    statusCode: number,
    latency: number
  ) {
    const today = new Date().toISOString().split('T')[0];
    const key = `metrics:ai_config:api:${today}`;

    await Promise.all([
      redis.hincrby(key, `${method}_${endpoint}_total`, 1),
      redis.hincrby(key, `${method}_${endpoint}_${statusCode}`, 1),
      redis.lpush(
        `metrics:ai_config:api_latency:${method}_${endpoint}`,
        latency
      )
    ]);
  }

  // 获取监控数据
  static async getMetrics(date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const [pageViews, uniqueUsers, operations, apiMetrics] = await Promise.all([
      redis.get(`metrics:ai_config:page_views:${targetDate}`),
      redis.scard(`metrics:ai_config:unique_users:${targetDate}`),
      redis.hgetall(`metrics:ai_config:operations:${targetDate}`),
      redis.hgetall(`metrics:ai_config:api:${targetDate}`)
    ]);

    return {
      pageViews: parseInt(pageViews || '0'),
      uniqueUsers,
      operations,
      api: apiMetrics
    };
  }
}
```

## 9. 测试策略

### 9.1 组件测试

```typescript
// __tests__/components/ai-config.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIConfigPage } from '@/app/ai-config/page';
import { AIConfigProvider } from '@/contexts/ai-config-context';

const mockProviders = [
  {
    id: '1',
    name: 'OpenAI',
    type: 'openai',
    enabled: true,
    rateLimitPerMinute: 60
  }
];

const mockConfigs = [
  {
    id: '1',
    name: 'GPT-4 Chat',
    model: 'gpt-4',
    providerId: '1',
    enabled: true,
    scenarios: ['chat'],
    parameters: { temperature: 0.7 }
  }
];

const MockWrapper = ({ children }: { children: React.ReactNode }) => (
  <AIConfigProvider>
    {children}
  </AIConfigProvider>
);

describe('AI配置页面', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('渲染提供商列表', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProviders
    });

    render(
      <MockWrapper>
        <AIConfigPage />
      </MockWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('OpenAI')).toBeInTheDocument();
    });
  });

  test('创建新提供商', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProviders
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '2', name: 'Anthropic' })
      });

    render(
      <MockWrapper>
        <AIConfigPage />
      </MockWrapper>
    );

    const addButton = screen.getByText('添加提供商');
    fireEvent.click(addButton);

    const nameInput = screen.getByLabelText('提供商名称');
    fireEvent.change(nameInput, { target: { value: 'Anthropic' } });

    const submitButton = screen.getByText('保存');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai-config/providers',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Anthropic')
        })
      );
    });
  });

  test('测试模型配置', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProviders
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigs
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Hello, world!',
          latency: 1500,
          success: true
        })
      });

    render(
      <MockWrapper>
        <AIConfigPage />
      </MockWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('GPT-4 Chat')).toBeInTheDocument();
    });

    const testButton = screen.getByText('测试');
    fireEvent.click(testButton);

    const promptInput = screen.getByPlaceholderText('输入测试提示词');
    fireEvent.change(promptInput, { target: { value: 'Hello' } });

    const runTestButton = screen.getByText('运行测试');
    fireEvent.click(runTestButton);

    await waitFor(() => {
      expect(screen.getByText('Hello, world!')).toBeInTheDocument();
      expect(screen.getByText('1500ms')).toBeInTheDocument();
    });
  });
});
```

### 9.2 API测试

```typescript
// __tests__/api/ai-config.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/ai-config/providers/route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    aiProvider: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}));

jest.mock('@/lib/get-current-user', () => ({
  getCurrentUser: jest.fn(() => ({
    id: 'user1',
    permissions: ['ai_config_manage']
  }))
}));

describe('/api/ai-config/providers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('GET - 获取提供商列表', async () => {
    const mockProviders = [
      {
        id: '1',
        name: 'OpenAI',
        type: 'openai',
        enabled: true
      }
    ];

    (prisma.aiProvider.findMany as jest.Mock).mockResolvedValue(mockProviders);

    const { req, res } = createMocks({
      method: 'GET'
    });

    await handler.GET(req);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data).toEqual(mockProviders);
  });

  test('POST - 创建提供商', async () => {
    const newProvider = {
      name: 'Anthropic',
      type: 'anthropic',
      apiKey: 'test-key',
      rateLimitPerMinute: 60
    };

    const createdProvider = {
      id: '2',
      ...newProvider,
      encryptedApiKey: 'encrypted-key',
      enabled: true
    };

    (prisma.aiProvider.create as jest.Mock).mockResolvedValue(createdProvider);

    const { req, res } = createMocks({
      method: 'POST',
      body: newProvider
    });

    await handler.POST(req);

    expect(res._getStatusCode()).toBe(201);
    expect(prisma.aiProvider.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Anthropic',
        type: 'anthropic'
      })
    });
  });

  test('POST - 权限不足', async () => {
    const { getCurrentUser } = require('@/lib/get-current-user');
    getCurrentUser.mockResolvedValue({
      id: 'user1',
      permissions: []
    });

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: 'Test Provider',
        type: 'openai'
      }
    });

    await handler.POST(req);

    expect(res._getStatusCode()).toBe(403);
  });
});
```

## 10. 部署配置

### 10.1 环境变量

```bash
# .env.example
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/database"

# Redis配置
REDIS_URL="redis://localhost:6379"

# 加密密钥
ENCRYPTION_KEY="your-32-character-encryption-key"

# AI服务配置
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_AI_API_KEY="..."

# 监控配置
SENTRY_DSN="https://..."
MONITORING_WEBHOOK_URL="https://..."

# 安全配置
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# 限流配置
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# 缓存配置
CACHE_TTL=300
CACHE_MAX_SIZE=1000
```

### 10.2 Docker配置

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/aiconfig
      - REDIS_URL=redis://redis:6379
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=aiconfig
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 10.3 性能监控

```typescript
// lib/monitoring/performance.ts
import { NextRequest, NextResponse } from 'next/server';

export function withPerformanceMonitoring(handler: Function) {
  return async (request: NextRequest, context?: any) => {
    const startTime = Date.now();
    const url = request.url;
    const method = request.method;

    try {
      const response = await handler(request, context);
      const duration = Date.now() - startTime;

      // 记录成功请求
      await recordMetric({
        type: 'api_request',
        url,
        method,
        status: response.status,
        duration,
        success: true
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // 记录失败请求
      await recordMetric({
        type: 'api_request',
        url,
        method,
        status: 500,
        duration,
        success: false,
        error: error.message
      });

      throw error;
    }
  };
}

async function recordMetric(data: any) {
  try {
    // 发送到监控服务
    await fetch(process.env.MONITORING_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        service: 'ai-config',
        ...data
      })
    });
  } catch (error) {
    console.error('监控数据发送失败:', error);
  }
}
```

## 总结

AI模型配置页面是整个AI模块的核心管理界面，具有以下特点：

### 核心功能

- **统一管理**: 集中管理所有AI服务提供商和模型配置
- **智能优化**: 基于使用情况自动选择最优模型
- **实时监控**: 提供详细的使用统计和性能监控
- **安全可靠**: 加密存储API密钥，完善的权限控制

### 技术特色

- **LangChain集成**: 统一的AI模型调用接口
- **性能优化**: 缓存、虚拟化、批量操作等优化策略
- **监控完善**: 全面的错误处理和性能监控
- **扩展性强**: 支持多种AI服务提供商，易于扩展

### 用户体验

- **直观易用**: 清晰的界面布局和操作流程
- **实时反馈**: 即时的测试结果和状态更新
- **智能提示**: 基于使用情况的优化建议
- **响应式设计**: 适配各种设备和屏幕尺寸

该页面为整个AI模块提供了稳定可靠的配置管理基础，确保各个AI功能页面能够高效、安全地调用AI服务。
