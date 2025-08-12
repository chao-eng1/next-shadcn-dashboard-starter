import { Metadata } from 'next';
import { RequirementForm } from '@/features/requirement-management/components/requirement-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: '创建需求',
  description: '创建新的需求项目'
};

export default async function NewRequirementPage() {
  const t = await getTranslations('requirements');

  return (
    <div className='flex-1 space-y-4 p-4 pt-6 md:p-8'>
      <div className='flex items-center space-x-4'>
        <Link href='/dashboard/requirements'>
          <Button variant='ghost' size='sm'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            返回需求列表
          </Button>
        </Link>
      </div>

      <div className='space-y-4'>
        <div className='flex justify-center'>
          <Card className='mx-4 w-full max-w-7xl'>
            <CardHeader>
              <CardTitle className='text-center text-2xl'>需求信息</CardTitle>
              <CardDescription className='text-center'>
                请填写完整的需求信息，包括基本信息、详细描述和验收标准
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RequirementForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
