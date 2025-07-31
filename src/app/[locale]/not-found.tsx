'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  const t = useTranslations('errors');
  const locale = useLocale();

  return (
    <div className='bg-background flex min-h-screen flex-col items-center justify-center'>
      <div className='mx-auto max-w-md text-center'>
        <h1 className='text-primary text-6xl font-bold'>404</h1>
        <h2 className='text-foreground mt-4 text-2xl font-semibold'>
          {t('404')}
        </h2>
        <p className='text-muted-foreground mt-2'>{t('generic')}</p>
        <div className='mt-8 flex justify-center space-x-4'>
          <Button asChild>
            <Link href={`/${locale}`}>
              <Home className='mr-2 h-4 w-4' />
              返回首页
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
