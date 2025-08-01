'use client';

import { useState } from 'react';
import { RequirementList } from '@/features/requirement-management/components/requirement-list';
import { RequirementFilter } from '@/features/requirement-management/components/requirement-filter';
import { RequirementActions } from '@/features/requirement-management/components/requirement-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, Kanban, BarChart3 } from 'lucide-react';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('title')}
          </h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <div className="hidden md:block">
          <RequirementActions />
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">{t('list')}</span>
            </TabsTrigger>
            <TabsTrigger value="kanban" className="flex items-center gap-2">
              <Kanban className="h-4 w-4" />
              <span className="hidden sm:inline">{t('kanban')}</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">{t('stats.title')}</span>
            </TabsTrigger>
          </TabsList>
          <div className="md:hidden">
            <RequirementActions />
          </div>
        </div>

        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('list')}</CardTitle>
              <CardDescription>
                {t('views.listDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RequirementFilter onFilterChange={handleFilterChange} />
              <RequirementList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kanban" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('kanban')}</CardTitle>
              <CardDescription>
                {t('views.kanbanDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-16">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold">看板视图开发中</h3>
                  <p className="text-sm text-muted-foreground">
                    即将推出拖拽式看板管理，让需求状态管理更加直观便捷
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>统计分析</CardTitle>
              <CardDescription>
                需求统计和分析数据
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-16">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold">统计视图开发中</h3>
                  <p className="text-sm text-muted-foreground">
                    即将推出详细的数据分析和可视化图表，助您洞察需求趋势
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}