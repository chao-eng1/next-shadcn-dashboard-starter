'use client';

import React, { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FolderOpen, Building } from 'lucide-react';
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

interface ProjectDropdownProps {
  projects: Project[];
  selectedProject: Project | null;
  onProjectSelect: (project: Project | null) => void;
  placeholder?: string;
  className?: string;
  allowNone?: boolean;
  noneLabel?: string;
  showMemberCount?: boolean;
  showStatus?: boolean;
  disabled?: boolean;
}

export function ProjectDropdown({
  projects,
  selectedProject,
  onProjectSelect,
  placeholder = "选择项目...",
  className,
  allowNone = true,
  noneLabel = "无项目上下文",
  showMemberCount = true,
  showStatus = true,
  disabled = false
}: ProjectDropdownProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // 过滤项目列表
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // 只显示活跃的项目
      if (project.status === 'archived') {
        return false;
      }
      
      // 根据搜索查询过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          project.name.toLowerCase().includes(query) ||
          (project.description && project.description.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
  }, [projects, searchQuery]);

  const handleValueChange = (value: string) => {
    if (value === 'none') {
      onProjectSelect(null);
    } else {
      const project = projects.find(p => p.id === value);
      onProjectSelect(project || null);
    }
    setIsOpen(false);
  };

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
    <Select
      value={selectedProject?.id || 'none'}
      onValueChange={handleValueChange}
      disabled={disabled}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue>
          {selectedProject ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={selectedProject.image} alt={selectedProject.name} />
                <AvatarFallback className="text-xs">
                  {selectedProject.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{selectedProject.name}</span>
              {showStatus && (
                <div className={cn("h-2 w-2 rounded-full", getStatusColor(selectedProject.status))} />
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="w-full">
        {/* 搜索框 */}
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索项目..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        
        <ScrollArea className="max-h-60">
          {/* 无项目选项 */}
          {allowNone && (
            <SelectItem value="none" className="p-3">
              <div className="flex items-center gap-3 w-full">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-muted-foreground">{noneLabel}</p>
                  <p className="text-sm text-muted-foreground">不关联任何项目的私聊</p>
                </div>
              </div>
            </SelectItem>
          )}
          
          {filteredProjects.length === 0 && searchQuery ? (
            <div className="p-4 text-center text-muted-foreground">
              <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">未找到匹配的项目</p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <SelectItem key={project.id} value={project.id} className="p-3">
                <div className="flex items-center gap-3 w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={project.image} alt={project.name} />
                    <AvatarFallback className="text-xs">
                      {project.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{project.name}</p>
                      {showStatus && (
                        <div className="flex items-center gap-1">
                          <div className={cn("h-2 w-2 rounded-full", getStatusColor(project.status))} />
                          <span className="text-xs text-muted-foreground">
                            {getStatusLabel(project.status)}
                          </span>
                        </div>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground truncate">{project.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {showMemberCount && project.memberCount !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          {project.memberCount} 成员
                        </Badge>
                      )}
                      {project.role && (
                        <Badge variant="secondary" className="text-xs">
                          {project.role}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))
          )}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
}