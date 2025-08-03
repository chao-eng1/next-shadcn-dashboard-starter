import { Metadata } from 'next';
import { RequirementRelationManager } from '@/features/requirement-management/components/requirement-relation-manager';
import { RequirementDependencyGraph } from '@/features/requirement-management/components/requirement-dependency-graph';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Link2, GitBranch, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export const metadata: Metadata = {
  title: '需求关联管理',
  description: '管理需求与项目、任务的关联关系和依赖关系'
};

export default function RequirementRelationsPage() {
  const t = useTranslations('requirements');

  return (
    <div className='flex-1 space-y-4 p-4 pt-6 md:p-8'>
      <div className='flex items-center space-x-4'>
        <Link href='/dashboard/requirements'>
          <Button variant='ghost' size='sm'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            返回需求列表
          </Button>
        </Link>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>需求关联管理</h2>
          <p className='text-muted-foreground'>
            管理需求与项目、任务的关联关系，以及需求之间的依赖关系
          </p>
        </div>
      </div>

      <Tabs defaultValue='projects' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='projects' className='flex items-center gap-2'>
            <Link2 className='h-4 w-4' />
            项目关联
          </TabsTrigger>
          <TabsTrigger value='tasks' className='flex items-center gap-2'>
            <GitBranch className='h-4 w-4' />
            任务关联
          </TabsTrigger>
          <TabsTrigger value='dependencies' className='flex items-center gap-2'>
            <Network className='h-4 w-4' />
            依赖关系
          </TabsTrigger>
        </TabsList>

        <TabsContent value='projects' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>项目关联管理</CardTitle>
              <CardDescription>
                管理需求与项目的关联关系，支持多项目关联
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RequirementRelationManager type='project' />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='tasks' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>任务关联管理</CardTitle>
              <CardDescription>
                管理需求与具体任务的关联，追溯实现进度
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RequirementRelationManager type='task' />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='dependencies' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>依赖关系管理</CardTitle>
                <CardDescription>
                  管理需求之间的依赖关系和优先级排序
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RequirementRelationManager type='dependency' />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>依赖关系图</CardTitle>
                <CardDescription>可视化展示需求之间的依赖关系</CardDescription>
              </CardHeader>
              <CardContent>
                <RequirementDependencyGraph />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
