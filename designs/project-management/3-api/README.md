# 项目管理模块 - API设计

本文档详细描述项目管理模块的API设计，包括API端点、请求响应格式、错误处理和身份验证。

## 目录

1. [API概述](#api概述)
2. [基础路径](#基础路径)
3. [通用响应格式](#通用响应格式)
4. [错误处理](#错误处理)
5. [身份验证与授权](#身份验证与授权)
6. [项目API端点](#项目api端点)
7. [任务API端点](#任务api端点)
8. [迭代API端点](#迭代api端点)
9. [成员API端点](#成员api端点)
10. [评论API端点](#评论api端点)
11. [附件API端点](#附件api端点)
12. [标签API端点](#标签api端点)
13. [速率限制](#速率限制)
14. [版本控制](#版本控制)

## API概述

项目管理模块API基于REST风格设计，使用JSON作为数据交换格式。API通过Next.js 15的App Router API路由实现，支持标准的HTTP方法（GET, POST, PATCH, DELETE）。

## 基础路径

所有项目管理相关的API都使用以下基础路径：

```
/api/projects
```

## 通用响应格式

API响应采用统一的JSON格式：

成功响应:

```json
{
  "success": true,
  "data": {
    // 响应数据
  },
  "meta": {
    // 元数据，如分页信息
  }
}
```

错误响应:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述信息",
    "details": {
      // 详细错误信息
    }
  }
}
```

## 错误处理

API使用以下HTTP状态码:

- **200 OK**: 请求成功
- **201 Created**: 资源创建成功
- **400 Bad Request**: 客户端错误，请求参数无效
- **401 Unauthorized**: 未认证，需要登录
- **403 Forbidden**: 无权限访问资源
- **404 Not Found**: 资源不存在
- **409 Conflict**: 资源冲突，例如唯一性约束冲突
- **422 Unprocessable Entity**: 请求格式正确但语义错误
- **429 Too Many Requests**: 请求频率超过限制
- **500 Internal Server Error**: 服务器内部错误

错误代码示例:

- `INVALID_PARAMETERS`: 请求参数无效
- `RESOURCE_NOT_FOUND`: 资源不存在
- `PERMISSION_DENIED`: 权限不足
- `ALREADY_EXISTS`: 资源已存在
- `VALIDATION_ERROR`: 验证错误
- `SERVER_ERROR`: 服务器内部错误

## 身份验证与授权

所有API请求都需要身份验证，通过以下机制实现:

1. **Cookie认证**: 使用会话Cookie验证用户身份
2. **权限检查**: 根据用户角色和权限检查资源访问权限
3. **项目成员检查**: 验证用户是否为项目成员

API路由中身份验证实现:

```typescript
// /api/projects/[projectId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  // 获取当前用户
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未授权访问'
        }
      },
      { status: 401 }
    );
  }

  // 获取项目
  const projectId = params.projectId;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        where: { userId: user.id }
      }
    }
  });

  // 项目不存在
  if (!project) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: '项目不存在'
        }
      },
      { status: 404 }
    );
  }

  // 检查用户是否为项目成员
  if (project.members.length === 0 && project.ownerId !== user.id) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: '无权访问此项目'
        }
      },
      { status: 403 }
    );
  }

  // 返回项目数据
  return NextResponse.json({
    success: true,
    data: project
  });
}
```

## 项目API端点

### 获取项目列表

获取当前用户参与的所有项目。

- **URL**: `/api/projects`
- **方法**: `GET`
- **查询参数**:
  - `status`: 项目状态筛选 (可选)
  - `role`: 用户角色筛选 (可选)
  - `search`: 搜索关键词 (可选)
  - `sort`: 排序字段 (可选)
  - `order`: 排序顺序 (asc/desc) (可选)
  - `page`: 页码，默认1 (可选)
  - `limit`: 每页数量，默认10 (可选)
- **响应**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "project-id-1",
        "name": "项目名称",
        "description": "项目描述",
        "status": "ACTIVE",
        "visibility": "PRIVATE",
        "startDate": "2023-01-15T00:00:00.000Z",
        "endDate": "2023-12-31T00:00:00.000Z",
        "progress": 65,
        "memberCount": 5,
        "taskStats": {
          "total": 45,
          "completed": 32
        },
        "createdAt": "2023-01-10T00:00:00.000Z",
        "updatedAt": "2023-06-20T00:00:00.000Z"
      }
      // 其他项目...
    ],
    "meta": {
      "total": 15,
      "page": 1,
      "limit": 10,
      "totalPages": 2
    }
  }
  ```

### 创建项目

创建新项目。

- **URL**: `/api/projects`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "name": "项目名称",
    "description": "项目描述",
    "startDate": "2023-01-15T00:00:00.000Z",
    "endDate": "2023-12-31T00:00:00.000Z",
    "status": "ACTIVE",
    "visibility": "PRIVATE"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "project-id",
      "name": "项目名称",
      "description": "项目描述",
      "status": "ACTIVE",
      "visibility": "PRIVATE",
      "startDate": "2023-01-15T00:00:00.000Z",
      "endDate": "2023-12-31T00:00:00.000Z",
      "ownerId": "user-id",
      "createdAt": "2023-06-20T00:00:00.000Z",
      "updatedAt": "2023-06-20T00:00:00.000Z"
    }
  }
  ```

### 获取项目详情

获取特定项目的详细信息。

- **URL**: `/api/projects/:projectId`
- **方法**: `GET`
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "project-id",
      "name": "项目名称",
      "description": "项目描述",
      "status": "ACTIVE",
      "visibility": "PRIVATE",
      "startDate": "2023-01-15T00:00:00.000Z",
      "endDate": "2023-12-31T00:00:00.000Z",
      "ownerId": "user-id",
      "progress": 65,
      "memberCount": 5,
      "taskStats": {
        "total": 45,
        "completed": 32,
        "inProgress": 8,
        "todo": 5,
        "blocked": 0
      },
      "createdAt": "2023-01-10T00:00:00.000Z",
      "updatedAt": "2023-06-20T00:00:00.000Z"
    }
  }
  ```

### 更新项目

更新特定项目的信息。

- **URL**: `/api/projects/:projectId`
- **方法**: `PATCH`
- **请求体**:
  ```json
  {
    "name": "更新的项目名称",
    "description": "更新的项目描述",
    "status": "COMPLETED",
    "endDate": "2023-11-30T00:00:00.000Z"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "project-id",
      "name": "更新的项目名称",
      "description": "更新的项目描述",
      "status": "COMPLETED",
      "visibility": "PRIVATE",
      "startDate": "2023-01-15T00:00:00.000Z",
      "endDate": "2023-11-30T00:00:00.000Z",
      "ownerId": "user-id",
      "createdAt": "2023-01-10T00:00:00.000Z",
      "updatedAt": "2023-06-25T00:00:00.000Z"
    }
  }
  ```

### 删除项目

删除特定项目。

- **URL**: `/api/projects/:projectId`
- **方法**: `DELETE`
- **响应**:
  ```json
  {
    "success": true,
    "data": null
  }
  ```

## 任务API端点

### 获取项目任务列表

获取项目的所有任务。

- **URL**: `/api/projects/:projectId/tasks`
- **方法**: `GET`
- **查询参数**:
  - `status`: 任务状态筛选 (可选)
  - `priority`: 优先级筛选 (可选)
  - `assignee`: 负责人ID筛选 (可选)
  - `sprint`: 迭代ID筛选 (可选)
  - `search`: 搜索关键词 (可选)
  - `sort`: 排序字段 (可选)
  - `order`: 排序顺序 (asc/desc) (可选)
  - `page`: 页码，默认1 (可选)
  - `limit`: 每页数量，默认20 (可选)
- **响应**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "task-id-1",
        "title": "任务标题",
        "description": "任务描述",
        "status": "IN_PROGRESS",
        "priority": "HIGH",
        "dueDate": "2023-07-15T00:00:00.000Z",
        "estimatedHours": 4,
        "completedAt": null,
        "projectId": "project-id",
        "parentTaskId": null,
        "sprintId": "sprint-id",
        "subtaskCount": 3,
        "subtaskCompletedCount": 1,
        "assignees": [
          {
            "id": "user-id-1",
            "name": "用户名",
            "image": "头像URL"
          }
        ],
        "tags": [
          {
            "id": "tag-id-1",
            "name": "功能",
            "color": "#3498db"
          }
        ],
        "createdAt": "2023-06-10T00:00:00.000Z",
        "updatedAt": "2023-06-20T00:00:00.000Z"
      }
      // 其他任务...
    ],
    "meta": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  }
  ```

### 创建任务

在项目中创建新任务。

- **URL**: `/api/projects/:projectId/tasks`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "title": "任务标题",
    "description": "任务描述",
    "status": "TODO",
    "priority": "HIGH",
    "dueDate": "2023-07-15T00:00:00.000Z",
    "estimatedHours": 4,
    "parentTaskId": null,
    "sprintId": "sprint-id",
    "assigneeIds": ["user-id-1"],
    "tagIds": ["tag-id-1"]
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "task-id",
      "title": "任务标题",
      "description": "任务描述",
      "status": "TODO",
      "priority": "HIGH",
      "dueDate": "2023-07-15T00:00:00.000Z",
      "estimatedHours": 4,
      "completedAt": null,
      "projectId": "project-id",
      "parentTaskId": null,
      "sprintId": "sprint-id",
      "createdAt": "2023-06-25T00:00:00.000Z",
      "updatedAt": "2023-06-25T00:00:00.000Z"
    }
  }
  ```

### 获取任务详情

获取特定任务的详细信息。

- **URL**: `/api/projects/:projectId/tasks/:taskId`
- **方法**: `GET`
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "task-id",
      "title": "任务标题",
      "description": "任务描述",
      "status": "TODO",
      "priority": "HIGH",
      "dueDate": "2023-07-15T00:00:00.000Z",
      "estimatedHours": 4,
      "completedAt": null,
      "projectId": "project-id",
      "parentTaskId": null,
      "sprintId": "sprint-id",
      "subtasks": [
        {
          "id": "subtask-id-1",
          "title": "子任务1",
          "status": "DONE"
        },
        {
          "id": "subtask-id-2",
          "title": "子任务2",
          "status": "TODO"
        }
      ],
      "assignees": [
        {
          "id": "user-id-1",
          "name": "用户名",
          "image": "头像URL"
        }
      ],
      "tags": [
        {
          "id": "tag-id-1",
          "name": "功能",
          "color": "#3498db"
        }
      ],
      "comments": [
        {
          "id": "comment-id-1",
          "content": "评论内容",
          "userId": "user-id-1",
          "userName": "用户名",
          "userImage": "头像URL",
          "createdAt": "2023-06-26T00:00:00.000Z"
        }
      ],
      "attachments": [
        {
          "id": "attachment-id-1",
          "filename": "文件名.pdf",
          "filepath": "文件路径",
          "mimetype": "application/pdf",
          "size": 1024000,
          "uploaderId": "user-id-1",
          "uploaderName": "用户名",
          "createdAt": "2023-06-26T00:00:00.000Z"
        }
      ],
      "createdAt": "2023-06-25T00:00:00.000Z",
      "updatedAt": "2023-06-26T00:00:00.000Z"
    }
  }
  ```

### 更新任务

更新特定任务的信息。

- **URL**: `/api/projects/:projectId/tasks/:taskId`
- **方法**: `PATCH`
- **请求体**:
  ```json
  {
    "title": "更新的任务标题",
    "status": "IN_PROGRESS",
    "priority": "MEDIUM",
    "assigneeIds": ["user-id-1", "user-id-2"]
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "task-id",
      "title": "更新的任务标题",
      "description": "任务描述",
      "status": "IN_PROGRESS",
      "priority": "MEDIUM",
      "dueDate": "2023-07-15T00:00:00.000Z",
      "estimatedHours": 4,
      "completedAt": null,
      "projectId": "project-id",
      "parentTaskId": null,
      "sprintId": "sprint-id",
      "createdAt": "2023-06-25T00:00:00.000Z",
      "updatedAt": "2023-06-27T00:00:00.000Z"
    }
  }
  ```

### 删除任务

删除特定任务。

- **URL**: `/api/projects/:projectId/tasks/:taskId`
- **方法**: `DELETE`
- **响应**:
  ```json
  {
    "success": true,
    "data": null
  }
  ```

## 迭代API端点

### 获取项目迭代列表

获取项目的所有迭代周期。

- **URL**: `/api/projects/:projectId/sprints`
- **方法**: `GET`
- **查询参数**:
  - `status`: 迭代状态筛选 (可选)
  - `sort`: 排序字段 (可选)
  - `order`: 排序顺序 (asc/desc) (可选)
- **响应**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "sprint-id-1",
        "name": "Sprint 1",
        "goal": "迭代目标",
        "startDate": "2023-01-15T00:00:00.000Z",
        "endDate": "2023-01-28T00:00:00.000Z",
        "status": "COMPLETED",
        "projectId": "project-id",
        "taskCount": 15,
        "completedTaskCount": 15,
        "createdAt": "2023-01-10T00:00:00.000Z",
        "updatedAt": "2023-01-28T00:00:00.000Z"
      },
      {
        "id": "sprint-id-2",
        "name": "Sprint 2",
        "goal": "迭代目标",
        "startDate": "2023-01-29T00:00:00.000Z",
        "endDate": "2023-02-11T00:00:00.000Z",
        "status": "ACTIVE",
        "projectId": "project-id",
        "taskCount": 12,
        "completedTaskCount": 5,
        "createdAt": "2023-01-25T00:00:00.000Z",
        "updatedAt": "2023-02-05T00:00:00.000Z"
      }
      // 其他迭代...
    ]
  }
  ```

### 创建迭代

在项目中创建新迭代。

- **URL**: `/api/projects/:projectId/sprints`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "name": "Sprint 3",
    "goal": "迭代目标",
    "startDate": "2023-02-12T00:00:00.000Z",
    "endDate": "2023-02-25T00:00:00.000Z",
    "status": "PLANNED"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "sprint-id-3",
      "name": "Sprint 3",
      "goal": "迭代目标",
      "startDate": "2023-02-12T00:00:00.000Z",
      "endDate": "2023-02-25T00:00:00.000Z",
      "status": "PLANNED",
      "projectId": "project-id",
      "createdAt": "2023-02-05T00:00:00.000Z",
      "updatedAt": "2023-02-05T00:00:00.000Z"
    }
  }
  ```

### 获取迭代详情

获取特定迭代的详细信息。

- **URL**: `/api/projects/:projectId/sprints/:sprintId`
- **方法**: `GET`
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "sprint-id",
      "name": "Sprint 3",
      "goal": "迭代目标",
      "startDate": "2023-02-12T00:00:00.000Z",
      "endDate": "2023-02-25T00:00:00.000Z",
      "status": "PLANNED",
      "projectId": "project-id",
      "tasks": [
        {
          "id": "task-id-1",
          "title": "任务标题1",
          "status": "TODO",
          "priority": "HIGH"
        },
        {
          "id": "task-id-2",
          "title": "任务标题2",
          "status": "TODO",
          "priority": "MEDIUM"
        }
      ],
      "taskStats": {
        "total": 12,
        "completed": 0,
        "inProgress": 0,
        "todo": 12,
        "blocked": 0
      },
      "burndown": {
        "ideal": [24, 22, 20, 18, 16, 14, 12, 10, 8, 6, 4, 2, 0],
        "actual": [
          24,
          24,
          23,
          21,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null
        ],
        "dates": [
          "2023-02-12",
          "2023-02-13",
          "2023-02-14",
          "2023-02-15",
          "2023-02-16",
          "2023-02-17",
          "2023-02-18",
          "2023-02-19",
          "2023-02-20",
          "2023-02-21",
          "2023-02-22",
          "2023-02-23",
          "2023-02-24",
          "2023-02-25"
        ]
      },
      "createdAt": "2023-02-05T00:00:00.000Z",
      "updatedAt": "2023-02-05T00:00:00.000Z"
    }
  }
  ```

### 更新迭代

更新特定迭代的信息。

- **URL**: `/api/projects/:projectId/sprints/:sprintId`
- **方法**: `PATCH`
- **请求体**:
  ```json
  {
    "name": "Sprint 3 - 更新",
    "status": "ACTIVE",
    "goal": "更新的迭代目标"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "sprint-id",
      "name": "Sprint 3 - 更新",
      "goal": "更新的迭代目标",
      "startDate": "2023-02-12T00:00:00.000Z",
      "endDate": "2023-02-25T00:00:00.000Z",
      "status": "ACTIVE",
      "projectId": "project-id",
      "createdAt": "2023-02-05T00:00:00.000Z",
      "updatedAt": "2023-02-12T00:00:00.000Z"
    }
  }
  ```

### 删除迭代

删除特定迭代。

- **URL**: `/api/projects/:projectId/sprints/:sprintId`
- **方法**: `DELETE`
- **响应**:
  ```json
  {
    "success": true,
    "data": null
  }
  ```

## 成员API端点

### 获取项目成员列表

获取项目的所有成员。

- **URL**: `/api/projects/:projectId/members`
- **方法**: `GET`
- **响应**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "member-id-1",
        "userId": "user-id-1",
        "name": "用户名1",
        "email": "user1@example.com",
        "image": "头像URL",
        "role": "OWNER",
        "joinedAt": "2023-01-10T00:00:00.000Z"
      },
      {
        "id": "member-id-2",
        "userId": "user-id-2",
        "name": "用户名2",
        "email": "user2@example.com",
        "image": "头像URL",
        "role": "ADMIN",
        "joinedAt": "2023-01-15T00:00:00.000Z"
      }
      // 其他成员...
    ]
  }
  ```

### 添加项目成员

向项目添加新成员。

- **URL**: `/api/projects/:projectId/members`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "userId": "user-id-3",
    "role": "MEMBER"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "member-id-3",
      "userId": "user-id-3",
      "projectId": "project-id",
      "role": "MEMBER",
      "joinedAt": "2023-06-27T00:00:00.000Z",
      "createdAt": "2023-06-27T00:00:00.000Z",
      "updatedAt": "2023-06-27T00:00:00.000Z"
    }
  }
  ```

### 更新成员角色

更新项目成员的角色。

- **URL**: `/api/projects/:projectId/members/:memberId`
- **方法**: `PATCH`
- **请求体**:
  ```json
  {
    "role": "ADMIN"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "member-id-3",
      "userId": "user-id-3",
      "projectId": "project-id",
      "role": "ADMIN",
      "joinedAt": "2023-06-27T00:00:00.000Z",
      "createdAt": "2023-06-27T00:00:00.000Z",
      "updatedAt": "2023-06-28T00:00:00.000Z"
    }
  }
  ```

### 移除项目成员

从项目中移除成员。

- **URL**: `/api/projects/:projectId/members/:memberId`
- **方法**: `DELETE`
- **响应**:
  ```json
  {
    "success": true,
    "data": null
  }
  ```

## 评论API端点

### 获取任务评论

获取任务的所有评论。

- **URL**: `/api/projects/:projectId/tasks/:taskId/comments`
- **方法**: `GET`
- **响应**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "comment-id-1",
        "content": "评论内容",
        "taskId": "task-id",
        "user": {
          "id": "user-id-1",
          "name": "用户名",
          "image": "头像URL"
        },
        "createdAt": "2023-06-26T00:00:00.000Z",
        "updatedAt": "2023-06-26T00:00:00.000Z"
      }
      // 其他评论...
    ]
  }
  ```

### 添加评论

向任务添加新评论。

- **URL**: `/api/projects/:projectId/tasks/:taskId/comments`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "content": "新的评论内容"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "comment-id-2",
      "content": "新的评论内容",
      "taskId": "task-id",
      "userId": "user-id",
      "createdAt": "2023-06-28T00:00:00.000Z",
      "updatedAt": "2023-06-28T00:00:00.000Z"
    }
  }
  ```

### 更新评论

更新评论内容。

- **URL**: `/api/projects/:projectId/tasks/:taskId/comments/:commentId`
- **方法**: `PATCH`
- **请求体**:
  ```json
  {
    "content": "更新的评论内容"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "comment-id-2",
      "content": "更新的评论内容",
      "taskId": "task-id",
      "userId": "user-id",
      "createdAt": "2023-06-28T00:00:00.000Z",
      "updatedAt": "2023-06-29T00:00:00.000Z"
    }
  }
  ```

### 删除评论

删除评论。

- **URL**: `/api/projects/:projectId/tasks/:taskId/comments/:commentId`
- **方法**: `DELETE`
- **响应**:
  ```json
  {
    "success": true,
    "data": null
  }
  ```

## 附件API端点

### 获取附件列表

获取项目或任务的所有附件。

- **URL**: `/api/projects/:projectId/attachments` 或 `/api/projects/:projectId/tasks/:taskId/attachments`
- **方法**: `GET`
- **响应**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "attachment-id-1",
        "filename": "文件名.pdf",
        "filepath": "文件路径",
        "mimetype": "application/pdf",
        "size": 1024000,
        "projectId": "project-id",
        "taskId": null,
        "uploader": {
          "id": "user-id-1",
          "name": "用户名"
        },
        "createdAt": "2023-06-26T00:00:00.000Z",
        "updatedAt": "2023-06-26T00:00:00.000Z"
      }
      // 其他附件...
    ]
  }
  ```

### 上传附件

上传附件到项目或任务。

- **URL**: `/api/projects/:projectId/attachments` 或 `/api/projects/:projectId/tasks/:taskId/attachments`
- **方法**: `POST`
- **请求体**:
  - 使用 `multipart/form-data` 格式
  - 文件字段名: `file`
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "attachment-id-2",
      "filename": "新文件名.docx",
      "filepath": "文件路径",
      "mimetype": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "size": 512000,
      "projectId": "project-id",
      "taskId": "task-id",
      "uploaderId": "user-id",
      "createdAt": "2023-06-29T00:00:00.000Z",
      "updatedAt": "2023-06-29T00:00:00.000Z"
    }
  }
  ```

### 删除附件

删除附件。

- **URL**: `/api/projects/:projectId/attachments/:attachmentId`
- **方法**: `DELETE`
- **响应**:
  ```json
  {
    "success": true,
    "data": null
  }
  ```

## 标签API端点

### 获取标签列表

获取项目的所有标签。

- **URL**: `/api/projects/:projectId/tags`
- **方法**: `GET`
- **响应**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "tag-id-1",
        "name": "功能",
        "color": "#3498db",
        "taskCount": 15,
        "createdAt": "2023-01-15T00:00:00.000Z",
        "updatedAt": "2023-01-15T00:00:00.000Z"
      },
      {
        "id": "tag-id-2",
        "name": "错误",
        "color": "#e74c3c",
        "taskCount": 8,
        "createdAt": "2023-01-15T00:00:00.000Z",
        "updatedAt": "2023-01-15T00:00:00.000Z"
      }
      // 其他标签...
    ]
  }
  ```

### 创建标签

创建新标签。

- **URL**: `/api/projects/:projectId/tags`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "name": "优化",
    "color": "#2ecc71"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "tag-id-3",
      "name": "优化",
      "color": "#2ecc71",
      "createdAt": "2023-06-29T00:00:00.000Z",
      "updatedAt": "2023-06-29T00:00:00.000Z"
    }
  }
  ```

### 更新标签

更新标签。

- **URL**: `/api/projects/:projectId/tags/:tagId`
- **方法**: `PATCH`
- **请求体**:
  ```json
  {
    "name": "性能优化",
    "color": "#27ae60"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "tag-id-3",
      "name": "性能优化",
      "color": "#27ae60",
      "createdAt": "2023-06-29T00:00:00.000Z",
      "updatedAt": "2023-06-30T00:00:00.000Z"
    }
  }
  ```

### 删除标签

删除标签。

- **URL**: `/api/projects/:projectId/tags/:tagId`
- **方法**: `DELETE`
- **响应**:
  ```json
  {
    "success": true,
    "data": null
  }
  ```

## 速率限制

为防止API滥用，实施以下速率限制：

- 匿名请求: 60次请求/小时
- 认证请求: 1000次请求/小时
- 特定端点限制:
  - 创建资源: 100次请求/小时
  - 上传文件: 50次请求/小时

超出限制时返回429状态码:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "请求频率超出限制，请稍后再试",
    "details": {
      "retryAfter": 60,
      "limit": 1000,
      "remaining": 0,
      "reset": "2023-06-30T01:00:00.000Z"
    }
  }
}
```

## 版本控制

API版本控制通过URL路径实现：

- 当前版本 (默认): `/api/projects/...`
- 显式版本: `/api/v1/projects/...`

当引入不兼容更改时，将创建新版本的API端点，如 `/api/v2/projects/...`。
