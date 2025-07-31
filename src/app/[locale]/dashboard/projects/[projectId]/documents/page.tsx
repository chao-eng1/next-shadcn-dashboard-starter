import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import PageContainer from '@/components/layout/page-container';
import { ProjectDocumentSummary } from '@/features/project-management/components/document/project-document-summary';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasProjectPermission } from '@/lib/permissions';
import { FileTextIcon, FolderIcon, PlusIcon } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({
  params
}: {
  params: { locale: string; projectId: string };
}): Promise<Metadata> {
  const { locale } = await params;
  const tProjects = await getTranslations({ locale, namespace: 'projects' });
  const tDocuments = await getTranslations({ locale, namespace: 'documents' });

  return {
    title: `${tProjects('title')} ${tDocuments('title')}`,
    description: tDocuments('messages.created')
  };
}

export default async function ProjectDocumentsPage({
  params
}: {
  params: { locale: string; projectId: string };
}) {
  const { locale, projectId } = await params;
  const tProjects = await getTranslations({ locale, namespace: 'projects' });
  const tDocuments = await getTranslations({ locale, namespace: 'documents' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // 检查用户是否有查看项目的权限
  const canViewProject = await hasProjectPermission(
    projectId,
    'project.view',
    user.id
  );

  if (!canViewProject) {
    redirect('/dashboard/projects');
  }

  // 获取项目信息
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    redirect('/dashboard/projects');
  }

  // 检查用户是否有创建文档的权限
  const canCreateDocument = await hasProjectPermission(
    projectId,
    'document.create',
    user.id
  );

  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-7xl flex-1 flex-col space-y-6 px-4 md:px-6 lg:px-8'>
        <Separator />

        <Card className='shadow-sm'>
          <CardHeader className='flex flex-wrap items-center justify-between gap-2'>
            <div className='flex items-center gap-2'>
              <h2 className='text-2xl font-semibold'>
                {project.name} - {tDocuments('title')}
              </h2>
            </div>
            {canCreateDocument && (
              <div className='flex gap-2'>
                <Button variant='outline' asChild>
                  <Link
                    href={`/dashboard/projects/${projectId}/documents/new-folder`}
                  >
                    <FolderIcon className='mr-2 h-4 w-4' />
                    {tCommon('create')} {tDocuments('form.category')}
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/dashboard/projects/${projectId}/documents/new`}>
                    <PlusIcon className='mr-2 h-4 w-4' />
                    {tDocuments('create')}
                  </Link>
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className='px-6'>
            <ProjectDocumentSummary projectId={projectId} userId={user.id} />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
