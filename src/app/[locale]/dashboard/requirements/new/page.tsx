import { Metadata } from 'next';
import { RequirementForm } from '@/features/requirement-management/components/requirement-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export const metadata: Metadata = {
  title: '创建需求',
  description: '创建新的需求项目'
};

export default function NewRequirementPage() {
  const t = useTranslations('requirements');

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
          <h2 className="text-3xl font-bold tracking-tight">{t('create')}</h2>
          <p className="text-muted-foreground">
            填写需求信息，创建新的需求项目
          </p>
        </div>

        <Card className="max-w-4xl">
          <CardHeader>
            <CardTitle>需求信息</CardTitle>
            <CardDescription>
              请填写完整的需求信息，包括基本信息、详细描述和验收标准
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RequirementForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}