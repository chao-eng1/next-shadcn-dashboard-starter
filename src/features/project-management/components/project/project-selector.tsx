'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface Project {
  id: string;
  name: string;
  status: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  currentProjectId?: string;
  onProjectChange?: (projectId: string) => void;
}

export function ProjectSelector({
  projects,
  currentProjectId,
  onProjectChange
}: ProjectSelectorProps) {
  return (
    <Select
      defaultValue={currentProjectId || 'all'}
      onValueChange={(value) => {
        // 直接调用回调函数，不进行路由跳转
        if (onProjectChange) {
          onProjectChange(value);
        }
      }}
    >
      <SelectTrigger className='w-[200px]'>
        <SelectValue placeholder='选择项目' />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='all'>全部项目</SelectItem>
        {projects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            {project.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
