import { Metadata } from 'next';
import { RequirementKanban } from '@/features/requirement-management/components/requirement-kanban';
import { RequirementFilter } from '@/features/requirement-management/components/requirement-filter';
import { RequirementActions } from '@/features/requirement-management/components/requirement-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export const metadata: Metadata = {
  title: '需求看板',
  description: '可视化需求状态管理和进度跟踪'
};

export default function RequirementKanbanPage() {
  const t = useTranslations('requirements');

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/requirements">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回需求列表
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{t('kanban')}</h2>
            <p className="text-muted-foreground">
              {t('views.kanbanDesc')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            看板设置
          </Button>
          <RequirementActions />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>需求看板</CardTitle>
              <CardDescription>
                拖拽需求卡片来更新状态，实时跟踪需求进度
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <RequirementFilter compact />
            <RequirementKanban />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}