'use client';

import { useRouter } from 'next/navigation';
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

interface KanbanSelectorProps {
  projects: Project[];
  currentProjectId?: string;
}

export function KanbanSelector({
  projects,
  currentProjectId
}: KanbanSelectorProps) {
  const router = useRouter();

  // 获取导航目标
  const getNavigationTarget = (value: string) => {
    if (value === 'all') {
      return '/dashboard/kanban';
    } else {
      return `/dashboard/projects/${value}/kanban`;
    }
  };

  return (
    <Select
      defaultValue={currentProjectId || 'all'}
      onValueChange={(value) => {
        const target = getNavigationTarget(value);
        router.push(target);
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
