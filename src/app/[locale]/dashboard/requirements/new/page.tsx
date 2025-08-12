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

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'requirements' });

  return {
    title: t('newRequirementTitle'),
    description: t('newRequirementDescription')
  };
}

export default async function NewRequirementPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'requirements' });

  return (
    <div className='flex-1 space-y-4 p-4 pt-6 md:p-8'>
      <div className='flex items-center space-x-4'>
        <Link href='/dashboard/requirements'>
          <Button variant='ghost' size='sm'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            {t('backToList')}
          </Button>
        </Link>
      </div>

      <div className='space-y-4'>
        <div className='flex justify-center'>
          <Card className='mx-4 w-full max-w-7xl'>
            <CardHeader>
              <CardTitle className='text-center text-2xl'>
                {t('requirementInfo')}
              </CardTitle>
              <CardDescription className='text-center'>
                {t('requirementFormDescription')}
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
