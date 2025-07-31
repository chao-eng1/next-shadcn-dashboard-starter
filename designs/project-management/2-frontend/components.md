# 项目管理模块 - 组件设计文档

本文档详细描述项目管理模块的组件设计，包括组件层次结构、属性定义和交互规范。

## 目录

1. [组件层次结构](#组件层次结构)
2. [核心组件详情](#核心组件详情)
   - [项目组件](#项目组件)
   - [任务组件](#任务组件)
   - [迭代组件](#迭代组件)
   - [团队组件](#团队组件)
   - [工具组件](#工具组件)
3. [组件交互规范](#组件交互规范)
4. [组件状态管理](#组件状态管理)
5. [组件复用策略](#组件复用策略)

## 组件层次结构

项目管理模块的组件按照功能和职责划分为以下层次结构：

```
features/
  project-management/                # 项目管理模块根目录
    components/                      # 组件目录
      project/                       # 项目相关组件
        project-card.tsx             # 项目卡片
        project-header.tsx           # 项目头部信息
        project-overview.tsx         # 项目概览
        project-form.tsx             # 项目表单
        project-filter.tsx           # 项目过滤器

      task/                          # 任务相关组件
        task-card.tsx                # 任务卡片
        task-form.tsx                # 任务表单
        task-detail.tsx              # 任务详情
        task-list.tsx                # 任务列表
        task-filter.tsx              # 任务过滤器
        subtask-list.tsx             # 子任务列表

      kanban/                        # 看板相关组件
        kanban-board.tsx             # 看板主组件
        kanban-column.tsx            # 看板列
        kanban-card.tsx              # 看板任务卡片

      sprint/                        # 迭代相关组件
        sprint-card.tsx              # 迭代卡片
        sprint-form.tsx              # 迭代表单
        sprint-timeline.tsx          # 迭代时间线
        burndown-chart.tsx           # 燃尽图

      team/                          # 团队相关组件
        member-list.tsx              # 成员列表
        member-card.tsx              # 成员卡片
        member-picker.tsx            # 成员选择器
        role-manager.tsx             # 角色管理器

      comment/                       # 评论相关组件
        comment-thread.tsx           # 评论线程
        comment-form.tsx             # 评论表单
        comment-item.tsx             # 评论项

      attachment/                    # 附件相关组件
        attachment-list.tsx          # 附件列表
        attachment-uploader.tsx      # 附件上传器
        attachment-item.tsx          # 附件项

      tag/                           # 标签相关组件
        tag-picker.tsx               # 标签选择器
        tag-manager.tsx              # 标签管理器
        tag-item.tsx                 # 标签项

      shared/                        # 共享组件
        priority-badge.tsx           # 优先级徽章
        status-badge.tsx             # 状态徽章
        date-display.tsx             # 日期显示
        progress-bar.tsx             # 进度条
        statistic-card.tsx           # 统计卡片

    layouts/                         # 布局组件
      project-layout.tsx             # 项目页面布局

    hooks/                           # 自定义钩子
      use-project.ts                 # 项目相关钩子
      use-task.ts                    # 任务相关钩子
      use-sprint.ts                  # 迭代相关钩子
      use-team.ts                    # 团队相关钩子

    utils/                           # 工具函数
      project-utils.ts               # 项目工具函数
      task-utils.ts                  # 任务工具函数
      date-utils.ts                  # 日期处理函数
      permission-utils.ts            # 权限处理函数
```

## 核心组件详情

### 项目组件

#### ProjectCard

项目卡片组件，显示项目的简要信息，用于项目列表页面。

**属性定义**:

```tsx
interface ProjectCardProps {
  id: string; // 项目ID
  name: string; // 项目名称
  description?: string; // 项目描述
  status: ProjectStatus; // 项目状态
  progress: number; // 项目进度(0-100)
  memberCount: number; // 成员数量
  taskStats: {
    // 任务统计
    total: number; // 总任务数
    completed: number; // 已完成任务数
  };
  startDate?: string; // 开始日期
  endDate?: string; // 结束日期
  onClick?: () => void; // 点击回调
  className?: string; // 自定义类名
}
```

**示例代码**:

```tsx
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader
} from '@/components/ui/card';
import { ProgressBar } from '../shared/progress-bar';
import { StatusBadge } from '../shared/status-badge';
import { DateDisplay } from '../shared/date-display';

export function ProjectCard({
  id,
  name,
  description,
  status,
  progress,
  memberCount,
  taskStats,
  startDate,
  endDate,
  onClick,
  className
}: ProjectCardProps) {
  return (
    <Card
      className={cn(
        'hover:border-primary/50 cursor-pointer transition-all',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className='pb-2'>
        <div className='flex items-start justify-between'>
          <h3 className='line-clamp-1 text-lg font-semibold'>{name}</h3>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className='pb-2'>
        {description && (
          <p className='text-muted-foreground mb-2 line-clamp-2 text-sm'>
            {description}
          </p>
        )}
        <div className='mb-2'>
          <ProgressBar value={progress} showLabel />
        </div>
        <div className='grid grid-cols-2 gap-2 text-sm'>
          <div>成员: {memberCount}</div>
          <div>
            任务: {taskStats.completed}/{taskStats.total}
          </div>
        </div>
      </CardContent>
      {(startDate || endDate) && (
        <CardFooter className='text-muted-foreground pt-0 text-xs'>
          <div className='flex w-full justify-between'>
            {startDate && (
              <div>
                开始: <DateDisplay date={startDate} format='short' />
              </div>
            )}
            {endDate && (
              <div>
                截止: <DateDisplay date={endDate} format='short' />
              </div>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
```

#### ProjectForm

项目表单组件，用于创建或编辑项目。

**属性定义**:

```tsx
interface ProjectFormProps {
  defaultValues?: Partial<ProjectFormValues>; // 默认值
  onSubmit: (values: ProjectFormValues) => void; // 提交回调
  isSubmitting?: boolean; // 是否正在提交
  submitLabel?: string; // 提交按钮文本
  className?: string; // 自定义类名
}

interface ProjectFormValues {
  name: string; // 项目名称
  description: string; // 项目描述
  startDate: Date | null; // 开始日期
  endDate: Date | null; // 结束日期
  status: ProjectStatus; // 项目状态
  visibility: ProjectVisibility; // 可见性
}
```

### 任务组件

#### TaskCard

任务卡片组件，用于显示任务的简要信息。

**属性定义**:

```tsx
interface TaskCardProps {
  id: string; // 任务ID
  title: string; // 任务标题
  description?: string; // 任务描述
  status: TaskStatus; // 任务状态
  priority: TaskPriority; // 任务优先级
  dueDate?: string; // 截止日期
  assignees?: {
    // 分配人员
    id: string;
    name: string;
    image?: string;
  }[];
  subtaskStats?: {
    // 子任务统计
    total: number;
    completed: number;
  };
  tags?: {
    // 标签
    id: string;
    name: string;
    color: string;
  }[];
  onClick?: () => void; // 点击回调
  className?: string; // 自定义类名
  isDraggable?: boolean; // 是否可拖拽
}
```

**示例代码**:

```tsx
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { PriorityBadge } from '../shared/priority-badge';
import { DateDisplay } from '../shared/date-display';
import { AvatarGroup } from '../shared/avatar-group';
import { TagList } from '../tag/tag-list';

export function TaskCard({
  id,
  title,
  description,
  priority,
  dueDate,
  assignees = [],
  subtaskStats,
  tags = [],
  onClick,
  className,
  isDraggable = false
}: TaskCardProps) {
  return (
    <Card
      className={cn(
        'hover:border-primary/50 cursor-pointer transition-all',
        isDraggable && 'active:cursor-grabbing',
        className
      )}
      onClick={onClick}
    >
      <CardContent className='p-3'>
        <div className='mb-1 flex items-start justify-between gap-2'>
          <h4 className='line-clamp-2 font-medium'>{title}</h4>
          <PriorityBadge priority={priority} />
        </div>

        {description && (
          <p className='text-muted-foreground mb-2 line-clamp-2 text-sm'>
            {description}
          </p>
        )}

        {tags.length > 0 && (
          <div className='mb-2'>
            <TagList tags={tags} size='sm' />
          </div>
        )}

        {subtaskStats && subtaskStats.total > 0 && (
          <div className='text-muted-foreground mb-2 text-xs'>
            子任务: {subtaskStats.completed}/{subtaskStats.total}
          </div>
        )}
      </CardContent>

      <CardFooter className='flex items-center justify-between p-3 pt-0'>
        {assignees.length > 0 && (
          <AvatarGroup users={assignees} limit={3} size='sm' />
        )}

        {dueDate && (
          <div className='text-xs'>
            <DateDisplay date={dueDate} format='short' />
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
```

#### KanbanBoard

看板组件，用于拖拽管理任务状态。

**属性定义**:

```tsx
interface KanbanBoardProps {
  columns: KanbanColumn[]; // 看板列
  onTaskMove: (
    taskId: string,
    sourceColumn: string,
    targetColumn: string,
    newIndex: number
  ) => void; // 任务移动回调
  onAddTask?: (columnId: string) => void; // 添加任务回调
  isLoading?: boolean; // 是否加载中
  className?: string; // 自定义类名
}

interface KanbanColumn {
  id: string; // 列ID
  title: string; // 列标题
  tasks: TaskCardProps[]; // 列中的任务
  color?: string; // 列颜色
  limit?: number; // 列任务数限制
}
```

### 迭代组件

#### SprintTimeline

迭代时间线组件，显示项目的迭代进度。

**属性定义**:

```tsx
interface SprintTimelineProps {
  sprints: SprintTimelineItem[]; // 迭代项
  currentSprintId?: string; // 当前迭代ID
  onSprintClick?: (sprintId: string) => void; // 迭代点击回调
  className?: string; // 自定义类名
}

interface SprintTimelineItem {
  id: string; // 迭代ID
  name: string; // 迭代名称
  startDate: string; // 开始日期
  endDate: string; // 结束日期
  status: SprintStatus; // 迭代状态
}
```

#### BurndownChart

燃尽图组件，显示迭代任务进度。

**属性定义**:

```tsx
interface BurndownChartProps {
  sprintId: string; // 迭代ID
  startDate: string; // 开始日期
  endDate: string; // 结束日期
  idealBurndown: number[]; // 理想燃尽线
  actualBurndown: (number | null)[]; // 实际燃尽线
  remainingPoints: number; // 剩余点数
  className?: string; // 自定义类名
}
```

### 团队组件

#### MemberList

成员列表组件，显示项目团队成员。

**属性定义**:

```tsx
interface MemberListProps {
  members: ProjectMember[]; // 成员列表
  onRoleChange?: (memberId: string, roleId: string) => void; // 角色变更回调
  onRemoveMember?: (memberId: string) => void; // 移除成员回调
  isLoading?: boolean; // 是否加载中
  className?: string; // 自定义类名
}

interface ProjectMember {
  id: string; // 成员ID
  userId: string; // 用户ID
  name: string; // 用户名称
  email: string; // 用户邮箱
  image?: string; // 用户头像
  role: {
    // 用户角色
    id: string;
    name: string;
  };
  joinedAt: string; // 加入时间
}
```

#### MemberPicker

成员选择器组件，用于选择项目成员。

**属性定义**:

```tsx
interface MemberPickerProps {
  projectId: string; // 项目ID
  selectedMemberIds?: string[]; // 已选成员ID
  onChange: (memberIds: string[]) => void; // 变更回调
  isMulti?: boolean; // 是否多选
  placeholder?: string; // 占位文本
  disabled?: boolean; // 是否禁用
  className?: string; // 自定义类名
}
```

### 工具组件

#### CommentThread

评论线程组件，显示任务评论。

**属性定义**:

```tsx
interface CommentThreadProps {
  taskId: string; // 任务ID
  comments: Comment[]; // 评论列表
  onAddComment: (content: string) => void; // 添加评论回调
  isLoading?: boolean; // 是否加载中
  className?: string; // 自定义类名
}

interface Comment {
  id: string; // 评论ID
  content: string; // 评论内容
  user: {
    // 评论用户
    id: string;
    name: string;
    image?: string;
  };
  createdAt: string; // 创建时间
}
```

#### AttachmentUploader

附件上传组件，用于上传任务附件。

**属性定义**:

```tsx
interface AttachmentUploaderProps {
  projectId: string; // 项目ID
  taskId?: string; // 任务ID
  onUploadComplete: (attachments: Attachment[]) => void; // 上传完成回调
  maxSize?: number; // 最大文件大小(字节)
  allowedTypes?: string[]; // 允许的文件类型
  className?: string; // 自定义类名
}
```

## 组件交互规范

### 拖拽交互

1. **看板拖拽**:
   - 任务卡片可以在列之间拖拽
   - 拖拽过程中显示视觉反馈
   - 拖拽结束后自动更新任务状态
   - 支持触摸设备拖拽

```tsx
// 使用 dnd-kit 实现拖拽功能
import {
  DndContext,
  DragOverlay,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';

// 在KanbanBoard组件中
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5
    }
  }),
  useSensor(KeyboardSensor)
);

return (
  <DndContext
    sensors={sensors}
    onDragEnd={handleDragEnd}
    onDragOver={handleDragOver}
  >
    <div className='flex gap-4 overflow-x-auto pb-4'>
      {columns.map((column) => (
        <KanbanColumn
          key={column.id}
          id={column.id}
          title={column.title}
          tasks={column.tasks}
          onAddTask={() => onAddTask?.(column.id)}
          color={column.color}
          limit={column.limit}
        />
      ))}
    </div>

    <DragOverlay>
      {activeId && (
        <TaskCard
          {...getTaskById(activeId)}
          className='w-[calc(100vw-32px)] opacity-80 sm:w-[280px]'
        />
      )}
    </DragOverlay>
  </DndContext>
);
```

### 状态转换

组件状态变更时的处理规范：

1. **加载状态**:

   - 显示骨架屏(Skeleton)或加载指示器
   - 禁用交互元素
   - 维持布局稳定性

2. **错误状态**:

   - 显示友好的错误消息
   - 提供重试选项
   - 保留部分功能可用性

3. **空状态**:
   - 显示引导性提示
   - 提供创建入口
   - 使用插图增强视觉吸引力

```tsx
// 列表组件的加载和空状态示例
{isLoading ? (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <Skeleton key={i} className="h-[120px] w-full rounded-md" />
    ))}
  </div>
) : items.length === 0 ? (
  <EmptyState
    title="暂无项目"
    description="创建您的第一个项目以开始管理工作"
    action={
      <Button onClick={onCreateNew}>
        <PlusIcon className="mr-2 h-4 w-4" />
        创建项目
      </Button>
    }
    icon={<FolderIcon className="h-12 w-12" />}
  />
) : (
  // 正常内容渲染
)}
```

## 组件状态管理

项目管理模块使用组合式状态管理策略：

1. **本地组件状态**: 使用 React 的 `useState` 和 `useReducer` 管理组件内部状态
2. **上下文状态**: 使用 React Context API 管理中等规模的共享状态
3. **Zustand 全局状态**: 使用 Zustand 管理全局状态和复杂状态逻辑

### 关键状态定义

**项目状态**:

```typescript
// /stores/project-store.ts
import { create } from 'zustand';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;

  // 异步 Actions
  fetchProjects: () => Promise<void>;
  fetchProjectById: (id: string) => Promise<void>;
  createProject: (data: ProjectFormValues) => Promise<void>;
  updateProject: (id: string, data: ProjectFormValues) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // 同步 Actions
  setCurrentProject: (project: Project | null) => void;
  sortProjects: (sortBy: string) => void;
  filterProjects: (filters: ProjectFilters) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      set({ projects: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  }

  // 其他 action 实现...
}));
```

**任务状态**:

```typescript
// /stores/task-store.ts
import { create } from 'zustand';

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;

  // 异步 Actions
  fetchTasks: (projectId: string) => Promise<void>;
  fetchTaskById: (id: string) => Promise<void>;
  createTask: (data: TaskFormValues) => Promise<void>;
  updateTask: (id: string, data: TaskFormValues) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // 任务状态变更
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;

  // 同步 Actions
  setCurrentTask: (task: Task | null) => void;
  filterTasks: (filters: TaskFilters) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  // 状态和 actions 实现...
}));
```

## 组件复用策略

项目管理模块采用以下组件复用策略：

1. **原子设计模式**: 构建可复用的原子级组件、分子级组件和模板
2. **组合优于继承**: 使用组合模式构建复杂组件
3. **自定义钩子**: 将逻辑和状态管理抽象为可复用的钩子
4. **高阶组件**: 使用 HOC 添加横切关注点的功能
5. **中间件模式**: 为操作和状态变更实现可插拔的中间件

### 自定义钩子示例

**项目钩子**:

```typescript
// /hooks/use-project.ts
export function useProject(projectId: string) {
  const { data, error, isLoading, mutate } = useSWR<Project>(
    projectId ? `/api/projects/${projectId}` : null,
    fetcher
  );

  const updateProject = async (values: ProjectFormValues) => {
    try {
      const updatedProject = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      }).then((res) => res.json());

      mutate(updatedProject, false);
      return updatedProject;
    } catch (error) {
      throw new Error('Failed to update project');
    }
  };

  return {
    project: data,
    isLoading,
    error,
    updateProject,
    refreshProject: () => mutate()
  };
}
```

**任务钩子**:

```typescript
// /hooks/use-task.ts
export function useTask(taskId: string) {
  // 实现任务数据获取和操作逻辑
}

export function useTaskDrag() {
  // 实现任务拖拽逻辑
}

export function useTaskFilters() {
  // 实现任务过滤逻辑
}
```

这些复用策略确保组件的可维护性、一致性和高效开发。
