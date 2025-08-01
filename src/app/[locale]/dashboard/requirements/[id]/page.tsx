import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RequirementDetail } from '@/features/requirement-management/components/requirement-detail';
import { RequirementComments } from '@/features/requirement-management/components/requirement-comments';
import { RequirementHistory } from '@/features/requirement-management/components/requirement-history';
import { RequirementRelations } from '@/features/requirement-management/components/requirement-relations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MessageSquare, History, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

interface RequirementDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params
}: RequirementDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  
  const requirement = await prisma.requirement.findUnique({
    where: { id },
    select: { title: true }
  });

  if (!requirement) {
    return {
      title: '需求未找到'
    };
  }

  return {
    title: `${requirement.title} - 需求详情`,
    description: `查看和编辑需求：${requirement.title}`
  };
}

export default async function RequirementDetailPage({
  params
}: RequirementDetailPageProps) {
  const { id } = await params;
  
  const requirement = await prisma.requirement.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          id: true,
          name: true
        }
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      tags: {
        include: {
          tag: true
        }
      },
      _count: {
        select: {
          comments: true,
          history: true
        }
      }
    }
  });

  if (!requirement) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/requirements">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回需求列表
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{requirement.title}</h2>
          <p className="text-muted-foreground">
            需求ID: {requirement.id} • 项目: {requirement.project?.name || '未关联'}
          </p>
        </div>

        <Tabs defaultValue="detail" className="space-y-4">
          <TabsList>
            <TabsTrigger value="detail">
              详情信息
            </TabsTrigger>
            <TabsTrigger value="relations" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              关联管理
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              评论讨论 ({requirement._count.comments})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              变更历史 ({requirement._count.history})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="detail" className="space-y-4">
            <RequirementDetail requirement={requirement} />
          </TabsContent>

          <TabsContent value="relations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>关联管理</CardTitle>
                <CardDescription>
                  管理需求与项目、任务、其他需求的关联关系
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RequirementRelations requirementId={requirement.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>评论讨论</CardTitle>
                <CardDescription>
                  需求相关的讨论和评论
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RequirementComments requirementId={requirement.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>变更历史</CardTitle>
                <CardDescription>
                  需求的所有变更记录和版本历史
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RequirementHistory requirementId={requirement.id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}