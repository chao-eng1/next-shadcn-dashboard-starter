import { Metadata } from 'next';
import { RequirementStats } from '@/features/requirement-management/components/requirement-stats';
import { RequirementCharts } from '@/features/requirement-management/components/requirement-charts';
import { RequirementProgress } from '@/features/requirement-management/components/requirement-progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export const metadata: Metadata = {
  title: '需求统计',
  description: '需求进度统计和数据分析'
};

export default function RequirementStatsPage() {
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
          <h2 className='text-3xl font-bold tracking-tight'>
            {t('stats.title')}
          </h2>
          <p className='text-muted-foreground'>需求进度统计和数据分析</p>
        </div>
      </div>

      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview' className='flex items-center gap-2'>
            <BarChart3 className='h-4 w-4' />
            统计概览
          </TabsTrigger>
          <TabsTrigger value='charts' className='flex items-center gap-2'>
            <TrendingUp className='h-4 w-4' />
            图表分析
          </TabsTrigger>
          <TabsTrigger value='progress' className='flex items-center gap-2'>
            <Calendar className='h-4 w-4' />
            进度跟踪
          </TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>总需求数</CardTitle>
                <BarChart3 className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>245</div>
                <p className='text-muted-foreground text-xs'>+20.1% 较上月</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>已完成</CardTitle>
                <TrendingUp className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>156</div>
                <p className='text-muted-foreground text-xs'>完成率 63.7%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>进行中</CardTitle>
                <Calendar className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>67</div>
                <p className='text-muted-foreground text-xs'>占比 27.3%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>待处理</CardTitle>
                <BarChart3 className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>22</div>
                <p className='text-muted-foreground text-xs'>占比 9.0%</p>
              </CardContent>
            </Card>
          </div>
          <RequirementStats />
        </TabsContent>

        <TabsContent value='charts' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>图表分析</CardTitle>
              <CardDescription>
                需求数量、完成率、优先级分布等统计图表
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RequirementCharts />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='progress' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>进度跟踪</CardTitle>
              <CardDescription>各项目需求完成进度和时间线展示</CardDescription>
            </CardHeader>
            <CardContent>
              <RequirementProgress />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
