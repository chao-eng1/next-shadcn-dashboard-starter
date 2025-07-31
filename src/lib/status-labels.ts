import {
  TASK_STATUS,
  TASK_PRIORITY,
  PROJECT_STATUS,
  PROJECT_VISIBILITY,
  SPRINT_STATUS
} from '@/constants/project';

// 获取任务状态的翻译标签
export function getTaskStatusLabel(
  status: keyof typeof TASK_STATUS,
  t: (key: string) => string
): string {
  const statusConfig = TASK_STATUS[status];
  if (!statusConfig) return status;
  return t(`status.${statusConfig.key}`);
}

// 获取任务优先级的翻译标签
export function getTaskPriorityLabel(
  priority: keyof typeof TASK_PRIORITY,
  t: (key: string) => string
): string {
  const priorityConfig = TASK_PRIORITY[priority];
  if (!priorityConfig) return priority;
  return t(`priority.${priorityConfig.key}`);
}

// 获取项目状态的翻译标签
export function getProjectStatusLabel(
  status: keyof typeof PROJECT_STATUS,
  t: (key: string) => string
): string {
  const statusConfig = PROJECT_STATUS[status];
  if (!statusConfig) return status;
  return t(`status.${statusConfig.key}`);
}

// 获取项目可见性的翻译标签
export function getProjectVisibilityLabel(
  visibility: keyof typeof PROJECT_VISIBILITY,
  t: (key: string) => string
): string {
  const visibilityConfig = PROJECT_VISIBILITY[visibility];
  if (!visibilityConfig) return visibility;
  return t(`visibility.${visibilityConfig.key}`);
}

// 获取迭代状态的翻译标签
export function getSprintStatusLabel(
  status: keyof typeof SPRINT_STATUS,
  t: (key: string) => string
): string {
  const statusConfig = SPRINT_STATUS[status];
  if (!statusConfig) return status;
  return t(`status.${statusConfig.key}`);
}
