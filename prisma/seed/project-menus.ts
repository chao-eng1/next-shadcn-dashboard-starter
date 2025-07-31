import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 添加项目管理相关菜单
 */
export async function addProjectMenus() {
  console.log('开始添加项目管理菜单...');

  try {
    // 查找仪表盘根菜单
    const dashboardMenu = await prisma.menu.findFirst({
      where: { path: '/dashboard' }
    });

    if (!dashboardMenu) {
      console.log('未找到仪表盘根菜单');
      return;
    }

    // 1. 创建或更新项目管理主菜单
    let projectsMenu = await prisma.menu.findFirst({
      where: { path: '/dashboard/projects' }
    });

    if (projectsMenu) {
      // 更新现有菜单
      projectsMenu = await prisma.menu.update({
        where: { id: projectsMenu.id },
        data: {
          name: '项目管理',
          icon: 'Briefcase',
          parentId: dashboardMenu.id,
          order: 2, // 在概览之后
          isVisible: true
        }
      });
    } else {
      // 创建新菜单
      projectsMenu = await prisma.menu.create({
        data: {
          name: '项目管理',
          path: '/dashboard/projects',
          icon: 'Briefcase',
          parentId: dashboardMenu.id,
          order: 2,
          isVisible: true
        }
      });
    }

    console.log(`添加/更新菜单: ${projectsMenu.name}`);

    // 为项目菜单关联project.view权限
    const projectViewPermission = await prisma.permission.findFirst({
      where: { name: 'project.view' }
    });

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

      console.log(`为菜单添加权限: ${projectsMenu.name} - project.view`);
    }

    // 2. 添加项目列表子菜单
    let projectsListMenu = await prisma.menu.findFirst({
      where: { path: '/dashboard/projects/list' }
    });

    if (projectsListMenu) {
      projectsListMenu = await prisma.menu.update({
        where: { id: projectsListMenu.id },
        data: {
          name: '项目列表',
          icon: 'List',
          parentId: projectsMenu.id,
          order: 1,
          isVisible: true
        }
      });
    } else {
      projectsListMenu = await prisma.menu.create({
        data: {
          name: '项目列表',
          path: '/dashboard/projects/list',
          icon: 'List',
          parentId: projectsMenu.id,
          order: 1,
          isVisible: true
        }
      });
    }

    console.log(`添加/更新菜单: ${projectsListMenu.name}`);

    // 添加项目查看权限
    const projectViewPermissionForList = await prisma.permission.findFirst({
      where: { name: 'project.view' }
    });

    if (projectViewPermissionForList) {
      await prisma.menuPermission.upsert({
        where: {
          menuId_permissionId: {
            menuId: projectsListMenu.id,
            permissionId: projectViewPermissionForList.id
          }
        },
        update: {},
        create: {
          menuId: projectsListMenu.id,
          permissionId: projectViewPermissionForList.id
        }
      });

      console.log(`为菜单添加权限: ${projectsListMenu.name} - project.view`);
    }

    // 3. 添加任务管理菜单
    let tasksMenu = await prisma.menu.findFirst({
      where: { path: '/dashboard/projects/tasks' }
    });

    if (tasksMenu) {
      tasksMenu = await prisma.menu.update({
        where: { id: tasksMenu.id },
        data: {
          name: '任务管理',
          icon: 'CheckSquare',
          parentId: projectsMenu.id,
          order: 2,
          isVisible: true
        }
      });
    } else {
      tasksMenu = await prisma.menu.create({
        data: {
          name: '任务管理',
          path: '/dashboard/projects/tasks',
          icon: 'CheckSquare',
          parentId: projectsMenu.id,
          order: 2,
          isVisible: true
        }
      });
    }

    console.log(`添加/更新菜单: ${tasksMenu.name}`);

    // 添加任务查看权限
    const taskViewPermission = await prisma.permission.findFirst({
      where: { name: 'task.view' }
    });

    if (taskViewPermission) {
      await prisma.menuPermission.upsert({
        where: {
          menuId_permissionId: {
            menuId: tasksMenu.id,
            permissionId: taskViewPermission.id
          }
        },
        update: {},
        create: {
          menuId: tasksMenu.id,
          permissionId: taskViewPermission.id
        }
      });

      console.log(`为菜单添加权限: ${tasksMenu.name} - task.view`);
    }

    // 4. 添加看板视图子菜单
    let kanbanMenu = await prisma.menu.findFirst({
      where: { path: '/dashboard/projects/tasks/kanban' }
    });

    if (kanbanMenu) {
      kanbanMenu = await prisma.menu.update({
        where: { id: kanbanMenu.id },
        data: {
          name: '看板视图',
          icon: 'Trello',
          parentId: tasksMenu.id,
          order: 1,
          isVisible: true
        }
      });
    } else {
      kanbanMenu = await prisma.menu.create({
        data: {
          name: '看板视图',
          path: '/dashboard/projects/tasks/kanban',
          icon: 'Trello',
          parentId: tasksMenu.id,
          order: 1,
          isVisible: true
        }
      });
    }

    console.log(`添加/更新菜单: ${kanbanMenu.name}`);

    // 5. 添加迭代管理菜单
    let sprintsMenu = await prisma.menu.findFirst({
      where: { path: '/dashboard/projects/sprints' }
    });

    if (sprintsMenu) {
      sprintsMenu = await prisma.menu.update({
        where: { id: sprintsMenu.id },
        data: {
          name: '迭代管理',
          icon: 'Calendar',
          parentId: projectsMenu.id,
          order: 3,
          isVisible: true
        }
      });
    } else {
      sprintsMenu = await prisma.menu.create({
        data: {
          name: '迭代管理',
          path: '/dashboard/projects/sprints',
          icon: 'Calendar',
          parentId: projectsMenu.id,
          order: 3,
          isVisible: true
        }
      });
    }

    console.log(`添加/更新菜单: ${sprintsMenu.name}`);

    // 添加迭代查看权限
    const sprintViewPermission = await prisma.permission.findFirst({
      where: { name: 'sprint.view' }
    });

    if (sprintViewPermission) {
      await prisma.menuPermission.upsert({
        where: {
          menuId_permissionId: {
            menuId: sprintsMenu.id,
            permissionId: sprintViewPermission.id
          }
        },
        update: {},
        create: {
          menuId: sprintsMenu.id,
          permissionId: sprintViewPermission.id
        }
      });

      console.log(`为菜单添加权限: ${sprintsMenu.name} - sprint.view`);
    }

    // 6. 添加文档管理菜单
    let documentsMenu = await prisma.menu.findFirst({
      where: { path: '/dashboard/projects/documents' }
    });

    if (documentsMenu) {
      documentsMenu = await prisma.menu.update({
        where: { id: documentsMenu.id },
        data: {
          name: '文档管理',
          icon: 'FileText',
          parentId: projectsMenu.id,
          order: 4,
          isVisible: true
        }
      });
    } else {
      documentsMenu = await prisma.menu.create({
        data: {
          name: '文档管理',
          path: '/dashboard/projects/documents',
          icon: 'FileText',
          parentId: projectsMenu.id,
          order: 4,
          isVisible: true
        }
      });
    }

    console.log(`添加/更新菜单: ${documentsMenu.name}`);

    // 添加文档查看权限
    const documentViewPermission = await prisma.permission.findFirst({
      where: { name: 'document.view' }
    });

    if (documentViewPermission) {
      await prisma.menuPermission.upsert({
        where: {
          menuId_permissionId: {
            menuId: documentsMenu.id,
            permissionId: documentViewPermission.id
          }
        },
        update: {},
        create: {
          menuId: documentsMenu.id,
          permissionId: documentViewPermission.id
        }
      });

      console.log(`为菜单添加权限: ${documentsMenu.name} - document.view`);
    }

    console.log('项目管理菜单添加完成');
  } catch (error) {
    console.error('添加项目管理菜单失败:', error);
  }
}

/**
 * 检查和初始化系统管理菜单
 */
export async function ensureSystemManagementMenu() {
  console.log('检查系统管理菜单...');

  try {
    // 查找仪表盘根菜单
    const dashboardMenu = await prisma.menu.findFirst({
      where: { path: '/dashboard' }
    });

    if (!dashboardMenu) {
      console.log('未找到仪表盘根菜单');
      return;
    }

    // 查找或创建系统管理菜单
    let systemMenu = await prisma.menu.findFirst({
      where: { path: '/dashboard/system-management' }
    });

    if (!systemMenu) {
      systemMenu = await prisma.menu.create({
        data: {
          name: '系统管理',
          path: '/dashboard/system-management',
          icon: 'Settings',
          parentId: dashboardMenu.id,
          order: 99, // 放在最后
          isVisible: true
        }
      });
      console.log('创建系统管理菜单');
    }

    // 查找或创建权限管理子菜单
    let permissionsMenu = await prisma.menu.findFirst({
      where: { path: '/dashboard/system-management/permissions' }
    });

    if (permissionsMenu) {
      // 更新现有菜单
      permissionsMenu = await prisma.menu.update({
        where: { id: permissionsMenu.id },
        data: {
          name: '权限管理',
          icon: 'Shield',
          parentId: systemMenu.id,
          order: 1,
          isVisible: true
        }
      });
    } else {
      // 创建新菜单
      permissionsMenu = await prisma.menu.create({
        data: {
          name: '权限管理',
          path: '/dashboard/system-management/permissions',
          icon: 'Shield',
          parentId: systemMenu.id,
          order: 1,
          isVisible: true
        }
      });
    }

    console.log(`添加/更新菜单: ${permissionsMenu.name}`);

    // 查找或创建权限修复子菜单
    let fixPermissionsMenu = await prisma.menu.findFirst({
      where: {
        path: '/dashboard/system-management/permissions/fix-permissions'
      }
    });

    if (fixPermissionsMenu) {
      // 更新现有菜单
      fixPermissionsMenu = await prisma.menu.update({
        where: { id: fixPermissionsMenu.id },
        data: {
          name: '修复权限',
          icon: 'Wrench',
          parentId: permissionsMenu.id,
          order: 1,
          isVisible: true
        }
      });
    } else {
      // 创建新菜单
      fixPermissionsMenu = await prisma.menu.create({
        data: {
          name: '修复权限',
          path: '/dashboard/system-management/permissions/fix-permissions',
          icon: 'Wrench',
          parentId: permissionsMenu.id,
          order: 1,
          isVisible: true
        }
      });
    }

    console.log(`添加/更新菜单: ${fixPermissionsMenu.name}`);
  } catch (error) {
    console.error('检查系统管理菜单失败:', error);
  }
}
