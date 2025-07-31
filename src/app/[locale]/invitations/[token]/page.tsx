import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import PageContainer from '@/components/layout/page-container';
import { InvitationActions } from '@/features/project-management/components/invitations/invitation-actions';

import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
import { formatDistanceToNow } from 'date-fns';
import {
  CalendarIcon,
  Clock,
  ExternalLink,
  Loader2,
  Mail,
  Users
} from 'lucide-react';

interface InvitationPageProps {
  params: {
    token: string;
  };
}

export async function generateMetadata({
  params
}: InvitationPageProps): Promise<Metadata> {
  try {
    // 获取邀请详情
    const invitation = await prisma.projectInvitation.findUnique({
      where: { token: params.token },
      include: {
        project: {
          select: {
            name: true
          }
        }
      }
    });

    if (!invitation) {
      return {
        title: '无效的邀请'
      };
    }

    return {
      title: `项目邀请 - ${invitation.project.name}`,
      description: `您被邀请加入 ${invitation.project.name} 项目`
    };
  } catch (error) {
    return {
      title: '项目邀请'
    };
  }
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    // 如果用户未登录，重定向到登录页并将当前URL作为回调地址
    redirect(`/auth/sign-in?redirect=/invitations/${params.token}`);
  }

  // 获取邀请详情
  const invitation = await prisma.projectInvitation.findUnique({
    where: { token: params.token },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          visibility: true,
          createdAt: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          _count: {
            select: {
              members: true
            }
          }
        }
      },
      inviter: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      }
    }
  });

  if (!invitation) {
    notFound();
  }

  // 检查邀请是否已过期
  const isExpired = new Date() > new Date(invitation.expiresAt);

  // 检查邀请状态是否不是待处理
  const isProcessed = invitation.status !== 'PENDING';

  // 检查邮箱是否匹配
  const isEmailMatch = invitation.email === user.email;

  // 检查用户是否已经是项目成员
  const isAlreadyMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: user.id,
        projectId: invitation.projectId
      }
    }
  });

  // 计算邀请剩余有效期
  const expiryTimeLeft = formatDistanceToNow(new Date(invitation.expiresAt), {
    addSuffix: true
  });

  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-md flex-1 flex-col justify-center space-y-6 px-4 md:px-6 lg:px-8'>
        <Card className='w-full'>
          <CardHeader className='text-center'>
            <CardTitle className='text-2xl'>项目邀请</CardTitle>
            <CardDescription>您已收到加入项目的邀请</CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {!isEmailMatch && (
              <div className='bg-destructive/10 text-destructive border-destructive rounded-md border p-4 text-sm'>
                <p>此邀请不是发送给您的账户 ({user.email})。</p>
                <p className='mt-2'>请使用邀请发送到的邮箱账户登录。</p>
              </div>
            )}

            {isEmailMatch && isProcessed && (
              <div className='rounded-md border border-blue-300 bg-blue-100 p-4 text-sm text-blue-800'>
                <p>此邀请已被处理。</p>
                {invitation.status === 'ACCEPTED' && (
                  <p className='mt-2'>您已接受此邀请并加入了项目。</p>
                )}
                {invitation.status === 'REJECTED' && (
                  <p className='mt-2'>您已拒绝此邀请。</p>
                )}
              </div>
            )}

            {isEmailMatch && !isProcessed && isExpired && (
              <div className='bg-destructive/10 text-destructive border-destructive rounded-md border p-4 text-sm'>
                <p>此邀请已过期。</p>
                <p className='mt-2'>请联系项目管理员重新发送邀请。</p>
              </div>
            )}

            {isEmailMatch && !isProcessed && !isExpired && isAlreadyMember && (
              <div className='rounded-md border border-blue-300 bg-blue-100 p-4 text-sm text-blue-800'>
                <p>您已经是此项目的成员。</p>
              </div>
            )}

            <div className='space-y-4'>
              <div className='bg-muted rounded-lg p-4'>
                <h3 className='text-lg font-semibold'>
                  {invitation.project.name}
                </h3>
                {invitation.project.description && (
                  <p className='text-muted-foreground mt-1 text-sm'>
                    {invitation.project.description}
                  </p>
                )}

                <Separator className='my-3' />

                <div className='text-muted-foreground flex flex-col gap-2 text-sm'>
                  <div className='flex items-center gap-1'>
                    <Users className='h-4 w-4' />
                    <span>{invitation.project._count.members} 位成员</span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <CalendarIcon className='h-4 w-4' />
                    <span>
                      创建于{' '}
                      {new Date(
                        invitation.project.createdAt
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className='space-y-3'>
                <p className='font-medium'>您将以此角色加入：</p>
                <Badge variant='outline' className='text-base'>
                  {invitation.role === 'ADMIN' && '管理员'}
                  {invitation.role === 'MEMBER' && '成员'}
                  {invitation.role === 'VIEWER' && '观察者'}
                </Badge>
              </div>

              <div className='space-y-3'>
                <p className='font-medium'>邀请者：</p>
                <div className='flex items-center gap-3'>
                  <Avatar>
                    <AvatarImage src={invitation.inviter.image || ''} />
                    <AvatarFallback>
                      {invitation.inviter.name?.charAt(0) ||
                        invitation.inviter.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='font-medium'>
                      {invitation.inviter.name || '未设置姓名'}
                    </p>
                    <p className='text-muted-foreground text-sm'>
                      {invitation.inviter.email}
                    </p>
                  </div>
                </div>
              </div>

              {invitation.message && (
                <div className='space-y-2'>
                  <p className='font-medium'>邀请消息：</p>
                  <div className='bg-muted rounded-md p-3 text-sm italic'>
                    "{invitation.message}"
                  </div>
                </div>
              )}

              {!isExpired && !isProcessed && (
                <div className='flex items-center gap-1 text-sm text-blue-600'>
                  <Clock className='h-4 w-4' />
                  <span>此邀请将于 {expiryTimeLeft} 过期</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className='flex flex-col space-y-4'>
            {isEmailMatch && !isProcessed && !isExpired && !isAlreadyMember && (
              <InvitationActions
                token={params.token}
                projectName={invitation.project.name}
              />
            )}

            {(isProcessed || isExpired || isAlreadyMember || !isEmailMatch) && (
              <Button asChild className='w-full'>
                <Link href='/dashboard'>
                  <ExternalLink className='mr-2 h-4 w-4' />
                  前往仪表盘
                </Link>
              </Button>
            )}

            {isAlreadyMember && (
              <Button asChild variant='outline' className='w-full'>
                <Link href={`/dashboard/projects/${invitation.projectId}`}>
                  <ExternalLink className='mr-2 h-4 w-4' />
                  查看项目
                </Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </PageContainer>
  );
}
