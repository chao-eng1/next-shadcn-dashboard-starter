'use client';

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, FolderOpen, Check, Building } from 'lucide-react';
import { cn } from '@/lib/utils';

// 项目接口
export interface Project {
  id: string;
  name: string;
  description?: string;
  image?: string;
  status: 'active' | 'inactive' | 'archived';
  memberCount?: number;
  role?: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  selectedProject: Project | null;
  onProjectSelect: (project: Project | null) => void;
  searchPlaceholder?: string;
  placeholder?: string;
  title?: string;
  className?: string;
  maxHeight?: string;
  allowNone?: boolean;
  noneLabel?: string;
  showMemberCount?: boolean;
  showStatus?: boolean;
}

export function ProjectSelector({
  projects,
  selectedProject,
  onProjectSelect,
  searchPlaceholder = '搜索项目名称或描述...',
  placeholder,
  title = '选择项目上下文',
  className,
  maxHeight = 'h-80',
  allowNone = true,
  noneLabel = '无项目上下文',
  showMemberCount = true,
  showStatus = true
}: ProjectSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects);

  // 过滤项目列表
  useEffect(() => {
    let filtered = projects.filter((project) => {
      // 只显示活跃的项目
      if (project.status === 'archived') {
        return false;
      }

      // 根据搜索查询过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          project.name.toLowerCase().includes(query) ||
          (project.description &&
            project.description.toLowerCase().includes(query))
        );
      }

      return true;
    });

    setFilteredProjects(filtered);
  }, [searchQuery, projects]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Building className='h-5 w-5' />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {/* 搜索框 */}
          <div className='relative'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9'
            />
          </div>

          {/* 项目列表 */}
          <ScrollArea className={maxHeight}>
            <div className='space-y-2'>
              {/* 无项目选项 */}
              {allowNone && (
                <ProjectItem
                  project={null}
                  isSelected={selectedProject === null}
                  onSelect={() => onProjectSelect(null)}
                  noneLabel={noneLabel}
                  showMemberCount={false}
                  showStatus={false}
                />
              )}

              {filteredProjects.length === 0 && searchQuery ? (
                <div className='text-muted-foreground py-8 text-center'>
                  <FolderOpen className='mx-auto mb-4 h-12 w-12 opacity-50' />
                  <p>未找到匹配的项目</p>
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    isSelected={selectedProject?.id === project.id}
                    onSelect={() => onProjectSelect(project)}
                    showMemberCount={showMemberCount}
                    showStatus={showStatus}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

// 项目项组件
interface ProjectItemProps {
  project: Project | null;
  isSelected: boolean;
  onSelect: () => void;
  noneLabel?: string;
  showMemberCount: boolean;
  showStatus: boolean;
}

function ProjectItem({
  project,
  isSelected,
  onSelect,
  noneLabel = '无项目上下文',
  showMemberCount,
  showStatus
}: ProjectItemProps) {
  // 处理无项目选项
  if (!project) {
    return (
      <div
        className={cn(
          'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
          isSelected
            ? 'border-primary bg-primary/5'
            : 'border-border hover:bg-accent'
        )}
        onClick={onSelect}
      >
        <div className='bg-muted flex h-10 w-10 items-center justify-center rounded-lg'>
          <FolderOpen className='text-muted-foreground h-5 w-5' />
        </div>

        <div className='min-w-0 flex-1'>
          <p className='text-muted-foreground font-medium'>{noneLabel}</p>
          <p className='text-muted-foreground text-sm'>不关联任何项目的私聊</p>
        </div>

        {isSelected && <Check className='text-primary h-5 w-5' />}
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-yellow-500';
      case 'archived':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return '活跃';
      case 'inactive':
        return '暂停';
      case 'archived':
        return '已归档';
      default:
        return '未知';
    }
  };

  return (
    <div
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:bg-accent'
      )}
      onClick={onSelect}
    >
      <Avatar className='h-10 w-10'>
        <AvatarImage src={project.image} alt={project.name} />
        <AvatarFallback>{project.name.charAt(0)}</AvatarFallback>
      </Avatar>

      <div className='min-w-0 flex-1'>
        <div className='flex items-center gap-2'>
          <p className='truncate font-medium'>{project.name}</p>
          {showStatus && (
            <div className='flex items-center gap-1'>
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  getStatusColor(project.status)
                )}
              />
              <span className='text-muted-foreground text-xs'>
                {getStatusLabel(project.status)}
              </span>
            </div>
          )}
        </div>
        {project.description && (
          <p className='text-muted-foreground truncate text-sm'>
            {project.description}
          </p>
        )}
        <div className='mt-1 flex items-center gap-2'>
          {showMemberCount && project.memberCount !== undefined && (
            <Badge variant='outline' className='text-xs'>
              {project.memberCount} 成员
            </Badge>
          )}
          {project.role && (
            <Badge variant='secondary' className='text-xs'>
              {project.role}
            </Badge>
          )}
        </div>
      </div>

      {isSelected && <Check className='text-primary h-5 w-5' />}
    </div>
  );
}
