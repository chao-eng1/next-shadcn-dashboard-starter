'use client';

import { useState } from 'react';
import { RequirementList } from '@/features/requirement-management/components/requirement-list';
import { RequirementFilter } from '@/features/requirement-management/components/requirement-filter';
import { RequirementActions } from '@/features/requirement-management/components/requirement-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, Kanban, BarChart3, Sparkles, Target, TrendingUp } from 'lucide-react';
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



export default function RequirementsPage() {
  const t = useTranslations('requirements');
  const [filters, setFilters] = useState<FilterOptions>({});

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    // TODO: 实现过滤逻辑
    console.log('Filter changed:', newFilters);
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* 美化的页面头部 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 p-8">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        <div className="relative flex items-center justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {t('title')}
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                  {t('description')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                <span>智能需求管理</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>实时进度跟踪</span>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <RequirementActions />
          </div>
        </div>
      </div>

      {/* 美化的标签页 */}
      <Tabs defaultValue="list" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger 
              value="list" 
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">{t('list')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="kanban" 
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
            >
              <Kanban className="h-4 w-4" />
              <span className="hidden sm:inline">{t('kanban')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">{t('stats.title')}</span>
            </TabsTrigger>
          </TabsList>
          <div className="md:hidden">
            <RequirementActions />
          </div>
        </div>

        <TabsContent value="list" className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <List className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">{t('list')}</CardTitle>
                  <CardDescription className="text-sm">
                    {t('views.listDesc')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <RequirementFilter onFilterChange={handleFilterChange} />
              <RequirementList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kanban" className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <Kanban className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">{t('kanban')}</CardTitle>
                  <CardDescription className="text-sm">
                    {t('views.kanbanDesc')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-16">
                <div className="text-center space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 mx-auto">
                    <Kanban className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">看板视图开发中</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      即将推出拖拽式看板管理，让需求状态管理更加直观便捷
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                  <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">统计分析</CardTitle>
                  <CardDescription className="text-sm">
                    需求统计和分析数据
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-16">
                <div className="text-center space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 mx-auto">
                    <BarChart3 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">统计视图开发中</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      即将推出详细的数据分析和可视化图表，助您洞察需求趋势
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}