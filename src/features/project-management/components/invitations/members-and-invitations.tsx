'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Users, Mail } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InviteMemberDialog } from './invite-member-dialog';
import { AddMemberDialog } from './add-member-dialog';
import { InvitationList } from './invitation-list';
import { ProjectMembersList } from '../project-members-list';

interface MembersAndInvitationsProps {
  projectId: string;
  userId: string;
  isOwner: boolean;
  hasManagePermission: boolean;
}

export function MembersAndInvitations({
  projectId,
  userId,
  isOwner,
  hasManagePermission
}: MembersAndInvitationsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('members');
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);

  // 获取待处理邀请数量
  const loadPendingInvitationsCount = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/invitations`);

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          // 计算待处理的邀请数量
          const pendingCount = data.data.filter(
            (invitation: any) => invitation.status === 'PENDING'
          ).length;

          setPendingInvitationsCount(pendingCount);
        }
      }
    } catch (error) {
      console.error('获取邀请数量失败:', error);
    }
  };

  // 加载待处理邀请数量
  useEffect(() => {
    if (hasManagePermission) {
      loadPendingInvitationsCount();
    }
  }, [projectId, hasManagePermission]);

  // 刷新数据
  const handleDataRefresh = () => {
    console.log('Data refresh triggered');
    // 强制刷新状态以触发重渲染
    setActiveTab((prevTab) => {
      // 先切换到其他值再切回，确保状态变化触发重渲染
      const temp = prevTab === 'members' ? 'invitations' : 'members';
      setTimeout(() => setActiveTab(prevTab), 0);
      return temp;
    });
    router.refresh();
    loadPendingInvitationsCount();
  };

  return (
    <Card className='w-full'>
      <CardHeader className='flex flex-row items-center justify-between'>
        <div>
          <CardTitle>团队成员与邀请</CardTitle>
          <CardDescription>管理项目团队成员和邀请</CardDescription>
        </div>
        {hasManagePermission && (
          <AddMemberDialog
            projectId={projectId}
            onMemberAdded={handleDataRefresh}
          />
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='mb-4'>
            <TabsTrigger value='members' className='flex items-center'>
              <Users className='mr-2 h-4 w-4' />
              成员
            </TabsTrigger>

            {hasManagePermission && (
              <TabsTrigger value='invitations' className='flex items-center'>
                <Mail className='mr-2 h-4 w-4' />
                邀请
                {pendingInvitationsCount > 0 && (
                  <Badge className='ml-2' variant='secondary'>
                    {pendingInvitationsCount}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value='members'>
            <ProjectMembersList
              projectId={projectId}
              userId={userId}
              isOwner={isOwner}
              hasManagePermission={hasManagePermission}
              onMemberChange={handleDataRefresh}
            />
          </TabsContent>

          {hasManagePermission && (
            <TabsContent value='invitations'>
              <InvitationList
                projectId={projectId}
                onInvitationUpdate={handleDataRefresh}
              />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
