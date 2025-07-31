import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { Card, CardContent } from '@/components/ui/card';
import PageContainer from '@/components/layout/page-container';
import { DocumentList } from '@/features/document-management/components/document-list';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasPermission } from '@/lib/permissions';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'documents' });

  return {
    title: t('title'),
    description: t('messages.created') // 使用现有的翻译键作为描述
  };
}

// 定义类型
interface Project {
  id: string;
  name: string;
  status: string;
}

interface ProjectMember {
  project: Project;
}

export default async function DocumentsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // 检查用户是否有查看文档的权限
  const canViewDocuments = await hasPermission(user.id, 'document.view');

  if (!canViewDocuments) {
    redirect('/dashboard');
  }

  // 获取所有用户有权限查看的项目
  const userProjects = await prisma.projectMember.findMany({
    where: {
      userId: user.id
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          status: true
        }
      }
    }
  });

  const projects = userProjects.map((member: ProjectMember) => member.project);

  // 获取用户的个人文档
  const personalDocuments = await prisma.document.findMany({
    where: {
      projectId: null, // 个人文档没有关联项目
      authorId: user.id
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      folder: {
        select: {
          id: true,
          name: true
        }
      },
      _count: {
        select: {
          attachments: true,
          comments: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  // 获取用户有权限查看的项目文档
  const projectIds = projects.map((project: Project) => project.id);
  const projectDocuments = await prisma.document.findMany({
    where: {
      projectId: { in: projectIds.length > 0 ? projectIds : [''] }
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      project: {
        select: {
          id: true,
          name: true,
          status: true
        }
      },
      _count: {
        select: {
          attachments: true,
          comments: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  // 获取用户的文件夹
  const folders = await prisma.documentFolder.findMany({
    where: {
      ownerId: user.id,
      type: 'PERSONAL'
    },
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: 'asc'
    }
  });

  // 检查权限
  const canCreateDocument = await hasPermission(user.id, 'document.create');
  const canEditDocument = await hasPermission(user.id, 'document.update');
  const canDeleteDocument = await hasPermission(user.id, 'document.delete');

  // 为每个文档添加当前用户ID，以便在客户端判断权限
  const personalDocsWithCurrentUser = personalDocuments.map((doc) => ({
    ...doc,
    currentUserId: user.id
  }));

  const projectDocsWithCurrentUser = projectDocuments.map((doc) => ({
    ...doc,
    currentUserId: user.id
  }));

  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-7xl flex-1 flex-col space-y-6 px-4 md:px-6 lg:px-8'>
        {/* <Separator /> */}

        <Card className='shadow-sm'>
          <CardContent className='px-6'>
            <DocumentList
              personalDocuments={personalDocsWithCurrentUser}
              projectDocuments={projectDocsWithCurrentUser}
              projects={projects}
              folders={folders}
              canCreateDocument={canCreateDocument}
              canEditDocument={canEditDocument}
              canDeleteDocument={canDeleteDocument}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
