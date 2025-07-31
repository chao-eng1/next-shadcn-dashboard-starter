# 项目管理模块 - 数据模型设计

本文档详细描述项目管理模块的数据模型设计，包括实体关系、字段定义和数据库结构。

## 目录

1. [概述](#概述)
2. [主要实体](#主要实体)
3. [实体关系图](#实体关系图)
4. [详细模型定义](#详细模型定义)
   - [Project (项目)](#project-项目)
   - [Task (任务)](#task-任务)
   - [Sprint (迭代周期)](#sprint-迭代周期)
   - [ProjectMember (项目成员)](#projectmember-项目成员)
   - [TaskAssignment (任务分配)](#taskassignment-任务分配)
   - [Comment (评论)](#comment-评论)
   - [Attachment (附件)](#attachment-附件)
   - [Tag (标签)](#tag-标签)
5. [数据关系和约束](#数据关系和约束)
6. [数据迁移策略](#数据迁移策略)

## 概述

项目管理模块需要支持基本的项目创建、任务管理、迭代规划、团队协作和进度跟踪功能。数据模型设计遵循关系型数据库的最佳实践，确保数据完整性、查询效率和扩展性。

## 主要实体

项目管理模块包含以下主要实体：

1. **Project (项目)** - 项目的基本信息
2. **Task (任务)** - 项目中的任务或工作项
3. **Sprint (迭代周期)** - 敏捷开发中的迭代周期
4. **ProjectMember (项目成员)** - 项目团队成员
5. **TaskAssignment (任务分配)** - 任务与成员的分配关系
6. **Comment (评论)** - 对任务的评论和讨论
7. **Attachment (附件)** - 项目和任务的附件
8. **Tag (标签)** - 用于分类任务的标签

## 实体关系图

```
+-------------+      +---------------+      +-------------+
|   Project   |------| ProjectMember |------|    User     |
+-------------+      +---------------+      +-------------+
       |                                          |
       |                                          |
       v                                          v
+-------------+      +----------------+      +-------------+
|   Sprint    |------| TaskAssignment |------|    Task     |
+-------------+      +----------------+      +-------------+
                                                   |
                                                   |
                                              +-------------+
                                              |   Comment   |
                                              +-------------+
                                                   |
                                              +-------------+
                                              | Attachment  |
                                              +-------------+
                                                   |
                                              +-------------+
                                              |     Tag     |
                                              +-------------+
```

## 详细模型定义

### Project (项目)

```prisma
model Project {
  id             String           @id @default(cuid())
  name           String
  description    String?
  startDate      DateTime?
  endDate        DateTime?
  status         ProjectStatus    @default(ACTIVE)
  visibility     ProjectVisibility @default(PRIVATE)
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  ownerId        String
  owner          User             @relation("OwnedProjects", fields: [ownerId], references: [id])
  members        ProjectMember[]
  tasks          Task[]
  sprints        Sprint[]
  attachments    Attachment[]

  @@map("projects")
}

enum ProjectStatus {
  PLANNING
  ACTIVE
  COMPLETED
  ARCHIVED
}

enum ProjectVisibility {
  PRIVATE
  TEAM
  PUBLIC
}
```

### Task (任务)

```prisma
model Task {
  id             String          @id @default(cuid())
  title          String
  description    String?
  status         TaskStatus      @default(TODO)
  priority       TaskPriority    @default(MEDIUM)
  dueDate        DateTime?
  estimatedHours Float?
  completedAt    DateTime?
  projectId      String
  project        Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  parentTaskId   String?
  parentTask     Task?           @relation("TaskToSubtask", fields: [parentTaskId], references: [id])
  subtasks       Task[]          @relation("TaskToSubtask")
  sprintId       String?
  sprint         Sprint?         @relation(fields: [sprintId], references: [id])
  assignments    TaskAssignment[]
  comments       Comment[]
  attachments    Attachment[]
  tags           TaskTag[]
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  @@map("tasks")
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  REVIEW
  DONE
  BLOCKED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

### Sprint (迭代周期)

```prisma
model Sprint {
  id             String       @id @default(cuid())
  name           String
  goal           String?
  startDate      DateTime
  endDate        DateTime
  status         SprintStatus @default(PLANNED)
  projectId      String
  project        Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks          Task[]
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@map("sprints")
}

enum SprintStatus {
  PLANNED
  ACTIVE
  COMPLETED
  CANCELLED
}
```

### ProjectMember (项目成员)

```prisma
model ProjectMember {
  id           String           @id @default(cuid())
  userId       String
  projectId    String
  role         ProjectMemberRole @default(MEMBER)
  joinedAt     DateTime         @default(now())
  user         User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  project      Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignments  TaskAssignment[]
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  @@unique([userId, projectId])
  @@map("project_members")
}

enum ProjectMemberRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}
```

### TaskAssignment (任务分配)

```prisma
model TaskAssignment {
  id              String    @id @default(cuid())
  taskId          String
  memberId        String
  assignedAt      DateTime  @default(now())
  task            Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
  member          ProjectMember @relation(fields: [memberId], references: [id], onDelete: Cascade)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([taskId, memberId])
  @@map("task_assignments")
}
```

### Comment (评论)

```prisma
model Comment {
  id          String    @id @default(cuid())
  content     String
  taskId      String
  userId      String
  task        Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("comments")
}
```

### Attachment (附件)

```prisma
model Attachment {
  id          String         @id @default(cuid())
  filename    String
  filepath    String
  mimetype    String
  size        Int
  projectId   String?
  project     Project?       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  taskId      String?
  task        Task?          @relation(fields: [taskId], references: [id], onDelete: Cascade)
  uploaderId  String
  uploader    User           @relation(fields: [uploaderId], references: [id])
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@map("attachments")
}
```

### Tag (标签)

```prisma
model Tag {
  id          String    @id @default(cuid())
  name        String
  color       String    @default("#3498db")
  tasks       TaskTag[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("tags")
}

model TaskTag {
  id          String    @id @default(cuid())
  taskId      String
  tagId       String
  task        Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
  tag         Tag       @relation(fields: [tagId], references: [id], onDelete: Cascade)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([taskId, tagId])
  @@map("task_tags")
}
```

## 数据关系和约束

1. **项目与用户**：每个项目有一个所有者（owner），所有者是系统中的用户。
2. **项目与成员**：项目可以有多个成员，通过 ProjectMember 表建立多对多关系。
3. **任务与项目**：任务必须属于一个项目，删除项目时级联删除相关任务。
4. **任务与子任务**：任务可以有子任务，形成树状结构，支持任务的分解。
5. **迭代与任务**：任务可以分配到迭代周期中，但不是必须的。
6. **任务分配**：任务可以分配给项目成员，通过 TaskAssignment 表建立多对多关系。
7. **附件关联**：附件可以关联到项目或任务（二者只能选其一）。

## 数据迁移策略

在实施此数据模型时，我们将采用以下迁移策略：

1. 创建新表结构，不影响现有数据。
2. 提供 API 和界面，允许用户将现有数据迁移到新的项目管理结构中。
3. 支持导入/导出功能，方便数据迁移和备份。
4. 实施版本控制，确保数据模型的变更可追踪和回滚。

数据模型的变更将通过 Prisma 迁移功能实现，确保安全、可靠的数据库结构更新。
