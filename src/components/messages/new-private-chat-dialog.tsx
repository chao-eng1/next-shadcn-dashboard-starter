'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, MessageCircle, AlertCircle } from 'lucide-react';
import { UserDropdown, type User } from './user-dropdown';
import { ProjectDropdown, type Project } from './project-dropdown';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

interface NewPrivateChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewPrivateChatDialog({ open, onOpenChange }: NewPrivateChatDialogProps) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [projectMembers, setProjectMembers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // 获取项目列表
  useEffect(() => {
    if (!open) return;
    
    const fetchProjects = async () => {
      try {
        setIsLoadingProjects(true);
        
        const projectsResponse = await fetch('/api/projects/selector?limit=100');

        if (!projectsResponse.ok) {
          const errorData = await projectsResponse.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || errorData.message || errorData.error || '获取项目列表失败';
          toast.error(errorMessage);
        } else {
          const projectsData = await projectsResponse.json();
          // 项目选择器API直接返回数组，不是包装的响应格式
          if (Array.isArray(projectsData)) {
            setProjects(projectsData);
          } else {
            console.error('获取的项目数据格式不正确:', projectsData);
            toast.error('项目数据格式错误');
            setProjects([]);
          }
        }

      } catch (error) {
        console.error('获取项目列表失败:', error);
        toast.error('获取项目列表失败，请重试');
      } finally {
        setIsLoadingProjects(false);
      }
    };
    
    fetchProjects();
  }, [open]);

  // 当选择项目时，获取项目成员
  useEffect(() => {
    if (!selectedProject) {
      setProjectMembers([]);
      return;
    }
    
    const fetchProjectMembers = async () => {
      try {
        setIsLoadingMembers(true);
        setSelectedUser(null); // 重置已选择的用户
        
        const membersResponse = await fetch(`/api/projects/${selectedProject.id}/members?excludeSelf=true`);

        if (!membersResponse.ok) {
          const errorData = await membersResponse.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || errorData.message || '获取项目成员失败';
          toast.error(errorMessage);
          setProjectMembers([]);
        } else {
          const result = await membersResponse.json();
          // API返回的是包装后的响应，需要解析data字段
          const membersData = result.success ? result.data : result;
          
          if (Array.isArray(membersData)) {
            // 转换数据格式以匹配User类型
            const formattedMembers = membersData.map((member: any) => ({
              id: member.user.id,
              name: member.user.name,
              email: member.user.email,
              image: member.user.image,
              status: member.user.status,
              isOnline: member.isOnline,
              lastSeen: member.lastSeen
            }));
            setProjectMembers(formattedMembers);
          } else {
            console.error('获取的项目成员数据格式不正确:', membersData);
            toast.error('项目成员数据格式错误');
            setProjectMembers([]);
          }
        }

      } catch (error) {
        console.error('获取项目成员失败:', error);
        toast.error('获取项目成员失败，请重试');
        setProjectMembers([]);
      } finally {
        setIsLoadingMembers(false);
      }
    };
    
    fetchProjectMembers();
  }, [selectedProject]);

  // 重置表单
  const resetForm = () => {
    setSelectedProject(null);
    setSelectedUser(null);
    setProjectMembers([]);
    setIsCreating(false);
  };

  // 处理对话框关闭
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isCreating) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  // 创建私聊会话
  const handleCreateChat = async () => {
    if (!selectedProject) {
      toast.error('请先选择项目');
      return;
    }

    if (!selectedUser) {
      toast.error('请选择要聊天的用户');
      return;
    }

    setIsCreating(true);
    
    try {
      // 调用项目私聊API创建会话
      const response = await fetch(`/api/projects/${selectedProject.id}/private-conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: selectedUser.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || '创建会话失败');
      }

      const data = await response.json();
      
      toast.success(`已在 ${selectedProject.name} 项目中创建与 ${selectedUser.name} 的私聊`);
      
      // 跳转到私聊页面
      router.push(`/dashboard/messages/private/${data.conversationId || selectedUser.id}`);
      handleOpenChange(false);
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '创建私聊失败');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            新建私聊
          </DialogTitle>
          <DialogDescription>
            先选择项目，再选择该项目中的成员来创建私聊会话
          </DialogDescription>
        </DialogHeader>

        {isLoadingProjects ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-muted-foreground">加载项目列表中...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 第一步：项目选择 */}
            <div className="space-y-2">
              <Label htmlFor="project-select">
                <span className="flex items-center gap-2">
                  第一步：选择项目 *
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">1</span>
                </span>
              </Label>
              <ProjectDropdown
                projects={projects}
                selectedProject={selectedProject}
                onProjectSelect={setSelectedProject}
                placeholder="选择项目..."
                disabled={isCreating}
              />
              {selectedProject && (
                <p className="text-sm text-muted-foreground">
                  ✅ 已选择项目：{selectedProject.name}
                </p>
              )}
            </div>

            {/* 第二步：用户选择 */}
            <div className="space-y-2">
              <Label htmlFor="user-select">
                <span className="flex items-center gap-2">
                  第二步：选择项目成员 *
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    selectedProject 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>2</span>
                </span>
              </Label>
              
              {!selectedProject ? (
                <div className="p-3 border rounded-md bg-muted/30">
                  <p className="text-sm text-muted-foreground text-center">
                    请先选择项目
                  </p>
                </div>
              ) : isLoadingMembers ? (
                <div className="flex items-center justify-center py-6">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">加载项目成员中...</span>
                  </div>
                </div>
              ) : projectMembers.length === 0 ? (
                <div className="p-3 border rounded-md bg-muted/30">
                  <p className="text-sm text-muted-foreground text-center">
                    该项目暂无其他成员
                  </p>
                </div>
              ) : (
                <UserDropdown
                  users={projectMembers}
                  selectedUser={selectedUser}
                  onUserSelect={setSelectedUser}
                  placeholder="选择要聊天的项目成员..."
                  currentUserId={currentUser?.id}
                  disabled={isCreating}
                />
              )}
              
              {selectedUser && (
                <p className="text-sm text-muted-foreground">
                  ✅ 已选择成员：{selectedUser.name} ({selectedUser.email})
                </p>
              )}
            </div>

            {/* 创建摘要 */}
            {selectedProject && selectedUser && (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  准备创建私聊
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">项目:</span>
                    <span className="font-medium">{selectedProject.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">聊天对象:</span>
                    <span className="font-medium">{selectedUser.name}</span>
                    <span className="text-muted-foreground">({selectedUser.email})</span>
                  </div>
                </div>
              </div>
            )}

            {/* 注意事项 */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200">注意事项</p>
                  <ul className="space-y-0.5 text-blue-700 dark:text-blue-300 text-xs">
                    <li>• 私聊会话将在所选项目的上下文中进行</li>
                    <li>• 只有项目成员可以参与项目内的私聊</li>
                    <li>• 如果与该成员的私聊已存在，将直接进入现有会话</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isCreating}
          >
            取消
          </Button>
          <Button
            onClick={handleCreateChat}
            disabled={!selectedProject || !selectedUser || isCreating || isLoadingMembers}
          >
            {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isCreating ? '创建中...' : '开始聊天'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}