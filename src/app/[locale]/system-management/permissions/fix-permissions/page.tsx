'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function FixPermissionsPage() {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const fixPermissions = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      // Call both seeding endpoints
      const basicResponse = await fetch(
        '/api/system-management/permissions/seed-basic',
        {
          method: 'POST'
        }
      );

      const messageResponse = await fetch(
        '/api/system-management/permissions/seed-message',
        {
          method: 'POST'
        }
      );

      if (basicResponse.ok && messageResponse.ok) {
        const basicData = await basicResponse.json();
        const messageData = await messageResponse.json();

        setResult({
          success: true,
          message: t('system.permissions.messages.permissionsFixed')
        });
      } else {
        let errorMessage =
          t('system.permissions.messages.fixPermissionsFailed') + ': ';

        if (!basicResponse.ok) {
          const basicError = await basicResponse.json();
          errorMessage += basicError.error || basicResponse.statusText;
        }

        if (!messageResponse.ok) {
          const messageError = await messageResponse.json();
          errorMessage += messageError.error || messageResponse.statusText;
        }

        setResult({
          success: false,
          message: errorMessage
        });
      }
    } catch (error) {
      console.error('Error fixing permissions:', error);
      setResult({
        success: false,
        message:
          t('system.permissions.messages.fixPermissionsFailed') +
          ': ' +
          (error.message || t('errors.unexpectedError'))
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='container mx-auto py-10'>
      <Card className='mx-auto w-full max-w-2xl'>
        <CardHeader>
          <CardTitle className='text-2xl font-bold'>
            {t('system.permissions.messages.fixPermissions')}
          </CardTitle>
          <CardDescription>
            {t('system.permissions.fixDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-muted-foreground'>
            {t('system.permissions.fixSteps.description')}:
          </p>
          <ul className='text-muted-foreground ml-4 list-inside list-disc space-y-1'>
            <li>{t('system.permissions.fixSteps.createBasic')}</li>
            <li>{t('system.permissions.fixSteps.createMessage')}</li>
            <li>{t('system.permissions.fixSteps.assignToAdmin')}</li>
            <li>{t('system.permissions.fixSteps.ensureFormat')}</li>
          </ul>

          {result && (
            <Alert
              variant={result.success ? 'default' : 'destructive'}
              className='mt-4'
            >
              <div className='flex items-start'>
                {result.success ? (
                  <CheckCircle className='mt-0.5 mr-2 h-5 w-5' />
                ) : (
                  <AlertCircle className='mt-0.5 mr-2 h-5 w-5' />
                )}
                <div>
                  <AlertTitle>
                    {result.success ? t('common.success') : t('common.error')}
                  </AlertTitle>
                  <AlertDescription className='mt-1'>
                    {result.message}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
        <CardFooter className='flex justify-between'>
          <Button variant='outline' asChild>
            <Link href='/system-management/permissions'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              {t('common.back')} {t('system.permissions.title')}
            </Link>
          </Button>
          <Button onClick={fixPermissions} disabled={isLoading}>
            {isLoading
              ? t('system.permissions.messages.fixingPermissions')
              : t('system.permissions.messages.fixPermissions')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
