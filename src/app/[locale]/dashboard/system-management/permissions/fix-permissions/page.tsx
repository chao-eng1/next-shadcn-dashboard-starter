import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/get-current-user';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { CheckCircle2Icon, ShieldAlertIcon } from 'lucide-react';
import Link from 'next/link';
import { hasPermission } from '@/lib/permissions';
import { assignAdminProjectPermissions } from '@/lib/permissions-utils';

export const metadata: Metadata = {
  title: '修复权限',
  description: '修复系统权限，确保管理员拥有所有项目管理相关权限'
};

export default async function FixPermissionsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // 检查用户是否有权限修复权限（需要是管理员）
  const isAdmin = user.roles.some((userRole) => userRole.role.name === 'admin');

  if (!isAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className='container py-10'>
      <div className='mx-auto max-w-xl'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-xl'>
              <ShieldAlertIcon className='text-primary h-5 w-5' />
              权限修复工具
            </CardTitle>
            <CardDescription>
              此工具将确保管理员角色拥有所有项目管理相关权限
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-4'>
            <div className='space-y-6'>
              <div>
                <h3 className='mb-2 text-base font-medium'>权限修复</h3>
                <p>
                  点击下方的"修复权限"按钮，系统将自动检查并分配以下权限给管理员角色：
                </p>

                <ul className='mt-2 list-disc space-y-1 pl-6'>
                  <li>项目管理权限（project.*）</li>
                  <li>任务管理权限（task.*）</li>
                  <li>迭代管理权限（sprint.*）</li>
                  <li>文档管理权限（document.*）</li>
                  <li>评论管理权限（comment.*）</li>
                  <li>附件管理权限（attachment.*）</li>
                </ul>

                <div className='mt-2 rounded-md bg-blue-50 p-4 text-blue-800'>
                  <p className='text-sm'>
                    <strong>提示：</strong>{' '}
                    此操作不会删除任何现有权限，只会添加缺少的权限。
                  </p>
                </div>
              </div>

              <div className='border-t pt-4'>
                <h3 className='mb-2 text-base font-medium'>菜单修复</h3>
                <p>
                  点击下方的"修复菜单"按钮，系统将自动添加项目管理相关菜单并关联必要权限：
                </p>

                <ul className='mt-2 list-disc space-y-1 pl-6'>
                  <li>项目管理主菜单</li>
                  <li>项目列表子菜单</li>
                  <li>任务管理子菜单</li>
                  <li>迭代管理子菜单</li>
                  <li>看板视图子菜单</li>
                  <li>文档管理子菜单</li>
                </ul>

                <div className='mt-2 rounded-md bg-blue-50 p-4 text-blue-800'>
                  <p className='text-sm'>
                    <strong>提示：</strong>{' '}
                    此操作不会删除任何现有菜单，只会添加或更新必要的菜单项。
                  </p>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className='flex flex-col gap-4 sm:flex-row sm:justify-between'>
            <Button asChild variant='outline'>
              <Link href='/dashboard/system-management/permissions'>
                返回权限管理
              </Link>
            </Button>

            <div className='flex gap-3'>
              <form
                action={async () => {
                  'use server';
                  await assignAdminProjectPermissions();
                }}
              >
                <Button type='submit' variant='secondary'>
                  修复权限
                </Button>
              </form>

              <form
                action={async () => {
                  'use server';
                  const response = await fetch(
                    `${process.env.NEXT_PUBLIC_APP_URL}/api/system-management/fix-project-menus`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      }
                    }
                  );

                  if (!response.ok) {
                    console.error('Failed to fix project menus');
                  }
                }}
              >
                <Button type='submit'>修复菜单</Button>
              </form>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
