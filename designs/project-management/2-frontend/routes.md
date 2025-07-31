# 项目管理模块 - 路由设计

本文档详细描述项目管理模块的路由设计，包括路由结构、页面组件和导航流程。

## 目录

1. [路由结构](#路由结构)
2. [页面组件](#页面组件)
3. [动态路由参数](#动态路由参数)
4. [路由权限控制](#路由权限控制)
5. [路由间数据传递](#路由间数据传递)

## 路由结构

项目管理模块基于 Next.js 15 的 App Router，路由结构如下：

```
/app/dashboard/projects                      # 项目列表页
  /page.tsx                                  # 项目列表页面
  /new                                       # 新建项目页
    /page.tsx                                # 新建项目页面
  /[projectId]                               # 项目详情(动态路由)
    /layout.tsx                              # 项目布局组件
    /page.tsx                                # 项目概览页面
    /loading.tsx                             # 项目加载状态
    /not-found.tsx                           # 项目未找到页面
    /error.tsx                               # 项目错误页面
    /tasks                                   # 任务列表页
      /page.tsx                              # 任务列表页面
      /new                                   # 新建任务页
        /page.tsx                            # 新建任务页面
      /[taskId]                              # 任务详情(动态路由)
        /page.tsx                            # 任务详情页面
        /loading.tsx                         # 任务加载状态
        /not-found.tsx                       # 任务未找到页面
    /kanban                                  # 任务看板页
      /page.tsx                              # 任务看板页面
    /sprints                                 # 迭代列表页
      /page.tsx                              # 迭代列表页面
      /new                                   # 新建迭代页
        /page.tsx                            # 新建迭代页面
      /[sprintId]                            # 迭代详情(动态路由)
        /page.tsx                            # 迭代详情页面
    /team                                    # 团队成员页
      /page.tsx                              # 团队成员页面
    /files                                   # 项目文件页
      /page.tsx                              # 项目文件页面
    /settings                                # 项目设置页
      /page.tsx                              # 项目设置页面
```

## 页面组件

以下是每个主要路由的页面组件定义：

### 项目列表页

**路径**: `/app/dashboard/projects/page.tsx`

```tsx
import { Metadata } from 'next';
import { ProjectList } from '@/features/project-management/components/project/project-list';
import { ProjectFilter } from '@/features/project-management/components/project/project-filter';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '项目管理',
  description: '管理您的项目和任务'
};

export default async function ProjectsPage() {
  return (
    <div className='container space-y-6 py-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold tracking-tight'>项目管理</h1>
        <Button asChild>
          <Link href='/dashboard/projects/new'>
            <PlusIcon className='mr-2 h-4 w-4' />
            新建项目
          </Link>
        </Button>
      </div>

      <ProjectFilter />

      <ProjectList />
    </div>
  );
}
```

### 新建项目页

**路径**: `/app/dashboard/projects/new/page.tsx`

```tsx
import { Metadata } from 'next';
import { ProjectForm } from '@/features/project-management/components/project/project-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BackButton } from '@/components/ui/back-button';

export const metadata: Metadata = {
  title: '新建项目',
  description: '创建新的项目'
};

export default function NewProjectPage() {
  return (
    <div className='container max-w-2xl space-y-6 py-6'>
      <div className='flex items-center'>
        <BackButton href='/dashboard/projects' />
        <h1 className='ml-2 text-3xl font-bold tracking-tight'>新建项目</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>项目信息</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm submitLabel='创建项目' />
        </CardContent>
      </Card>
    </div>
  );
}
```

### 项目布局

**路径**: `/app/dashboard/projects/[projectId]/layout.tsx`

```tsx
import { ProjectHeader } from '@/features/project-management/components/project/project-header';
import { ProjectTabs } from '@/features/project-management/components/project/project-tabs';
import { getProjectById } from '@/features/project-management/actions/project-actions';
import { notFound } from 'next/navigation';

export default async function ProjectLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { projectId: string };
}) {
  const projectId = params.projectId;
  const project = await getProjectById(projectId);

  if (!project) {
    notFound();
  }

  return (
    <div className='flex min-h-screen flex-col'>
      <ProjectHeader project={project} />
      <ProjectTabs projectId={projectId} />
      <div className='flex-1 p-6'>{children}</div>
    </div>
  );
}
```

### 项目概览页

**路径**: `/app/dashboard/projects/[projectId]/page.tsx`

```tsx
import { Metadata } from 'next';
import { ProjectOverview } from '@/features/project-management/components/project/project-overview';
import { getProjectById } from '@/features/project-management/actions/project-actions';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params
}: {
  params: { projectId: string };
}): Promise<Metadata> {
  const project = await getProjectById(params.projectId);

  if (!project) {
    return {
      title: '项目不存在'
    };
  }

  return {
    title: `${project.name} - 概览`,
    description: project.description || `项目 ${project.name} 的概览信息`
  };
}

export default async function ProjectOverviewPage({
  params
}: {
  params: { projectId: string };
}) {
  const project = await getProjectById(params.projectId);

  if (!project) {
    notFound();
  }

  return <ProjectOverview project={project} />;
}
```

### 任务看板页

**路径**: `/app/dashboard/projects/[projectId]/kanban/page.tsx`

```tsx
import { Metadata } from 'next';
import { KanbanView } from '@/features/project-management/components/kanban/kanban-view';
import { getProjectById } from '@/features/project-management/actions/project-actions';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params
}: {
  params: { projectId: string };
}): Promise<Metadata> {
  const project = await getProjectById(params.projectId);

  if (!project) {
    return {
      title: '项目不存在'
    };
  }

  return {
    title: `${project.name} - 看板`,
    description: `${project.name} 项目的任务看板视图`
  };
}

export default async function KanbanPage({
  params
}: {
  params: { projectId: string };
}) {
  const project = await getProjectById(params.projectId);

  if (!project) {
    notFound();
  }

  return <KanbanView projectId={params.projectId} />;
}
```

### 任务详情页

**路径**: `/app/dashboard/projects/[projectId]/tasks/[taskId]/page.tsx`

```tsx
import { Metadata } from 'next';
import { TaskDetail } from '@/features/project-management/components/task/task-detail';
import { getTaskById } from '@/features/project-management/actions/task-actions';
import { getProjectById } from '@/features/project-management/actions/project-actions';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params
}: {
  params: { projectId: string; taskId: string };
}): Promise<Metadata> {
  const task = await getTaskById(params.taskId);

  if (!task) {
    return {
      title: '任务不存在'
    };
  }

  return {
    title: `${task.title} - 任务详情`,
    description: task.description || `任务 ${task.title} 的详细信息`
  };
}

export default async function TaskDetailPage({
  params
}: {
  params: { projectId: string; taskId: string };
}) {
  const task = await getTaskById(params.taskId);

  if (!task || task.projectId !== params.projectId) {
    notFound();
  }

  return <TaskDetail task={task} />;
}
```

## 动态路由参数

项目管理模块使用以下动态路由参数：

1. **[projectId]** - 项目ID

   - 用于标识特定项目
   - 在项目详情页及其子页面中使用
   - 类型: `string`

2. **[taskId]** - 任务ID

   - 用于标识特定任务
   - 在任务详情页中使用
   - 类型: `string`

3. **[sprintId]** - 迭代ID
   - 用于标识特定迭代周期
   - 在迭代详情页中使用
   - 类型: `string`

根据 Next.js 15 的要求，动态路由参数是异步的，需要使用 `await` 来访问：

```tsx
// 路由处理函数中
export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const projectId = await params.projectId;
  // ...
}
```

## 路由权限控制

项目管理模块使用基于角色的访问控制(RBAC)来限制路由访问：

### 权限定义

1. **项目权限**:

   - `project.view` - 查看项目列表和项目详情
   - `project.create` - 创建新项目
   - `project.update` - 编辑项目信息
   - `project.delete` - 删除项目

2. **任务权限**:

   - `task.view` - 查看任务列表和任务详情
   - `task.create` - 创建新任务
   - `task.update` - 编辑任务信息
   - `task.delete` - 删除任务

3. **成员权限**:
   - `project.member.view` - 查看项目成员
   - `project.member.manage` - 管理项目成员

### 权限实现

使用中间件和服务器组件来实现权限控制：

1. **路由中间件**:

```tsx
// middleware.ts
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';

export default withAuth(
  async function middleware(request) {
    // 项目管理模块路由权限检查
    if (request.nextUrl.pathname.startsWith('/dashboard/projects')) {
      const projectMatch =
        request.nextUrl.pathname.match(/\/projects\/([^\/]+)/);
      const projectId = projectMatch ? projectMatch[1] : null;

      // 项目列表查看权限
      if (request.nextUrl.pathname === '/dashboard/projects') {
        if (!request.auth.hasPermission('project.view')) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }

      // 项目创建权限
      if (request.nextUrl.pathname === '/dashboard/projects/new') {
        if (!request.auth.hasPermission('project.create')) {
          return NextResponse.redirect(
            new URL('/dashboard/projects', request.url)
          );
        }
      }

      // 项目详情权限
      if (projectId && projectId !== 'new') {
        // 通过API验证用户是否为项目成员
        const memberCheck = await fetch(
          `${request.url}/api/projects/${projectId}/members/check`,
          {
            headers: {
              Cookie: request.headers.get('cookie') || ''
            }
          }
        );

        if (!memberCheck.ok) {
          return NextResponse.redirect(
            new URL('/dashboard/projects', request.url)
          );
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
);
```

2. **服务器组件权限检查**:

```tsx
// 在服务器组件中检查权限
import { checkPermission } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const hasPermission = await checkPermission('project.view');

  if (!hasPermission) {
    redirect('/dashboard');
  }

  // 组件内容...
}
```

3. **项目成员权限检查**:

```tsx
// 在服务器组件中检查项目成员权限
import { checkProjectMember } from '@/features/project-management/utils/permission-utils';
import { redirect } from 'next/navigation';

export default async function ProjectPage({
  params
}: {
  params: { projectId: string };
}) {
  const isMember = await checkProjectMember(params.projectId);

  if (!isMember) {
    redirect('/dashboard/projects');
  }

  // 组件内容...
}
```

## 路由间数据传递

项目管理模块使用以下方法在路由间传递数据：

### 1. URL参数

通过URL查询参数传递简单数据：

```tsx
// 传递参数
<Link
  href={`/dashboard/projects/${projectId}/tasks/new?priority=HIGH&sprintId=${sprintId}`}
>
  新建任务
</Link>;

// 接收参数
import { useSearchParams } from 'next/navigation';

export default function NewTaskPage() {
  const searchParams = useSearchParams();
  const priority = searchParams.get('priority');
  const sprintId = searchParams.get('sprintId');

  // 使用参数...
}
```

### 2. Nuqs搜索参数状态

使用Nuqs库管理持久化的搜索参数：

```tsx
import { useQueryState } from 'nuqs';

export function ProjectFilter() {
  const [status, setStatus] = useQueryState('status');
  const [sortBy, setSortBy] = useQueryState('sortBy');
  const [page, setPage] = useQueryState('page', { defaultValue: '1' });

  // 使用状态...
}
```

### 3. 路由状态

使用Next.js的路由状态API在路由间传递临时数据：

```tsx
// 发送方
import { useRouter } from 'next/navigation';

function CreateButton() {
  const router = useRouter();

  const handleCreate = () => {
    router.push('/dashboard/projects/new', {
      state: {
        fromDashboard: true,
        template: 'agile'
      }
    });
  };

  // 组件内容...
}

// 接收方
import { useRouteState } from '@/hooks/use-route-state';

function NewProjectPage() {
  const routeState = useRouteState();
  const fromDashboard = routeState?.fromDashboard;
  const template = routeState?.template;

  // 使用状态...
}
```

### 4. 状态管理库

使用Zustand等状态管理库在全局范围内共享数据：

```tsx
// 在一个路由中设置数据
const { setCurrentProject } = useProjectStore();
setCurrentProject(project);

// 在另一个路由中访问数据
const { currentProject } = useProjectStore();
```

这些数据传递方法根据需要的持久性和数据量选择使用。
