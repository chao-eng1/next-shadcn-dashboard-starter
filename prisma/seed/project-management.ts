import { PrismaClient, ProjectStatus, ProjectVisibility } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

/**
 * 为项目管理模块初始化种子数据
 */
export async function seedProjectManagement() {
  console.log('开始初始化项目管理模块数据...');

  // 初始化权限
  await seedProjectPermissions();

  // 初始化菜单
  await seedProjectMenus();

  // 创建演示项目（可选）
  if (process.env.SEED_DEMO_DATA === 'true') {
    await seedDemoProjects();
  }

  console.log('项目管理模块数据初始化完成');
}

/**
 * 初始化项目管理权限
 */
async function seedProjectPermissions() {
  console.log('正在初始化项目管理权限...');

  const permissions = [
    // 项目权限
    { name: 'project.view', description: '查看项目列表和项目详情' },
    { name: 'project.create', description: '创建新项目' },
    { name: 'project.update', description: '编辑项目信息' },
    { name: 'project.delete', description: '删除项目' },
    { name: 'project.member.manage', description: '管理项目成员' },
    { name: 'project.setting.manage', description: '管理项目设置' },

    // 任务权限
    { name: 'task.view', description: '查看任务详情' },
    { name: 'task.create', description: '创建新任务' },
    { name: 'task.update', description: '编辑任务信息' },
    { name: 'task.delete', description: '删除任务' },
    { name: 'task.assign', description: '分配任务给成员' },
    { name: 'task.status.update', description: '更新任务状态' },

    // 迭代权限
    { name: 'sprint.view', description: '查看迭代详情' },
    { name: 'sprint.create', description: '创建新迭代' },
    { name: 'sprint.update', description: '编辑迭代信息' },
    { name: 'sprint.delete', description: '删除迭代' },
    { name: 'sprint.manage_tasks', description: '管理迭代中的任务' },

    // 评论权限
    { name: 'comment.view', description: '查看评论' },
    { name: 'comment.create', description: '添加评论' },
    { name: 'comment.update', description: '编辑评论' },
    { name: 'comment.delete', description: '删除评论' },

    // 附件权限
    { name: 'attachment.view', description: '查看附件' },
    { name: 'attachment.upload', description: '上传附件' },
    { name: 'attachment.delete', description: '删除附件' },

    // 文档权限
    { name: 'document.view', description: '查看文档' },
    { name: 'document.create', description: '创建文档' },
    { name: 'document.update', description: '编辑文档' },
    { name: 'document.delete', description: '删除文档' },
    { name: 'document.manage', description: '管理文档' },
    { name: 'document.template.create', description: '创建文档模板' },
    { name: 'document.template.use', description: '使用文档模板' }
  ];

  // 批量创建权限
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: permission,
      create: permission
    });

    console.log(`创建权限: ${permission.name}`);
  }

  console.log('项目管理权限初始化完成');
}

/**
 * 初始化项目管理菜单
 */
async function seedProjectMenus() {
  console.log('正在初始化项目管理菜单...');

  // 查找或创建仪表盘根菜单
  const dashboardMenu = await prisma.menu.findFirst({
    where: { path: '/dashboard' }
  });

  if (!dashboardMenu) {
    console.log('未找到仪表盘菜单，无法添加项目管理菜单');
    return;
  }

  // 创建项目管理主菜单
  const projectsMenu = await prisma.menu.upsert({
    where: { path: '/dashboard/projects' },
    update: {
      name: '项目管理',
      icon: 'Briefcase',
      parentId: dashboardMenu.id,
      order: 2, // 在概览菜单之后
      isVisible: true
    },
    create: {
      name: '项目管理',
      path: '/dashboard/projects',
      icon: 'Briefcase',
      parentId: dashboardMenu.id,
      order: 2,
      isVisible: true
    }
  });

  console.log(`创建项目管理菜单: ${projectsMenu.name}`);

  // 获取项目管理权限
  const projectViewPermission = await prisma.permission.findUnique({
    where: { name: 'project.view' }
  });

  // 如果找到权限，将其关联到菜单
  if (projectViewPermission) {
    await prisma.menuPermission.upsert({
      where: {
        menuId_permissionId: {
          menuId: projectsMenu.id,
          permissionId: projectViewPermission.id
        }
      },
      update: {},
      create: {
        menuId: projectsMenu.id,
        permissionId: projectViewPermission.id
      }
    });

    console.log(`关联菜单权限: ${projectsMenu.name} - project.view`);
  }

  console.log('项目管理菜单初始化完成');
}

/**
 * 创建演示项目数据
 */
async function seedDemoProjects() {
  console.log('正在创建演示项目数据...');

  // 查找管理员用户
  const adminUser = await prisma.user.findFirst({
    where: {
      roles: {
        some: {
          role: {
            name: 'admin'
          }
        }
      }
    }
  });

  if (!adminUser) {
    console.log('未找到管理员用户，无法创建演示项目');
    return;
  }

  // 创建示例项目
  const demoProject = await prisma.project.create({
    data: {
      name: '示例项目',
      description: '这是一个演示项目，用于展示项目管理功能',
      status: 'ACTIVE' as ProjectStatus,
      visibility: 'TEAM' as ProjectVisibility,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90天后
      ownerId: adminUser.id
    }
  });

  console.log(`创建演示项目: ${demoProject.name}`);

  // 创建示例迭代
  const sprint = await prisma.sprint.create({
    data: {
      name: '迭代 1',
      goal: '完成核心功能开发',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14天后
      status: 'ACTIVE',
      projectId: demoProject.id
    }
  });

  console.log(`创建演示迭代: ${sprint.name}`);

  // 创建示例任务
  const taskStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
  const taskPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  for (let i = 0; i < 10; i++) {
    const status =
      taskStatuses[Math.floor(Math.random() * taskStatuses.length)];
    const priority =
      taskPriorities[Math.floor(Math.random() * taskPriorities.length)];

    const task = await prisma.task.create({
      data: {
        title: faker.lorem.sentence(4),
        description: faker.lorem.paragraphs(2),
        status: status,
        priority: priority,
        projectId: demoProject.id,
        sprintId: sprint.id,
        estimatedHours: Math.floor(Math.random() * 8) + 1,
        completedAt: status === 'DONE' ? new Date() : null
      }
    });

    console.log(`创建演示任务: ${task.title}`);

    // 为一些任务创建子任务
    if (i < 3) {
      for (let j = 0; j < 3; j++) {
        const subtask = await prisma.task.create({
          data: {
            title: `子任务 ${j + 1}: ${faker.lorem.sentence(3)}`,
            description: faker.lorem.paragraph(),
            status: status,
            priority: priority,
            projectId: demoProject.id,
            parentTaskId: task.id,
            estimatedHours: Math.floor(Math.random() * 4) + 1
          }
        });

        console.log(`创建子任务: ${subtask.title}`);
      }
    }
  }

  // 创建示例文档
  const document = await prisma.document.create({
    data: {
      title: '项目说明文档',
      content: `# 项目概述\n\n这是一个演示项目，用于展示项目管理功能。\n\n## 主要功能\n\n- 任务管理\n- 迭代规划\n- 看板视图\n- 团队协作\n- 文档管理`,
      format: 'MARKDOWN',
      status: 'PUBLISHED',
      projectId: demoProject.id,
      createdById: adminUser.id,
      updatedById: adminUser.id
    }
  });

  console.log(`创建示例文档: ${document.title}`);

  // 创建文档版本
  await prisma.documentVersion.create({
    data: {
      versionNumber: 1,
      content: document.content,
      documentId: document.id,
      createdById: adminUser.id
    }
  });

  console.log('演示数据创建完成');
}
