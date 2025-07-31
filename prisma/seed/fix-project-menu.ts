import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 修复项目管理菜单及其权限
 */
export async function fixProjectMenus() {
  console.log('开始修复项目管理菜单...');

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

    // 确保项目查看权限存在
    let projectViewPermission = await prisma.permission.findFirst({
      where: { name: 'project.view' }
    });

    if (!projectViewPermission) {
      projectViewPermission = await prisma.permission.create({
        data: {
          name: 'project.view',
          description: '查看项目列表和项目详情'
        }
      });
      console.log('创建项目查看权限: project.view');
    }

    // 确保项目创建权限存在
    let projectCreatePermission = await prisma.permission.findFirst({
      where: { name: 'project.create' }
    });

    if (!projectCreatePermission) {
      projectCreatePermission = await prisma.permission.create({
        data: {
          name: 'project.create',
          description: '创建新项目'
        }
      });
      console.log('创建项目创建权限: project.create');
    }

    // 为项目菜单关联project.view权限
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

    // 2. 创建或更新项目列表子菜单
    let projectListMenu = await prisma.menu.findFirst({
      where: {
        path: '/dashboard/projects',
        parentId: projectsMenu.id
      }
    });

    if (projectListMenu) {
      // 更新现有菜单
      projectListMenu = await prisma.menu.update({
        where: { id: projectListMenu.id },
        data: {
          name: '项目列表',
          icon: 'List',
          order: 1,
          isVisible: true
        }
      });
    } else {
      // 创建新菜单
      projectListMenu = await prisma.menu.create({
        data: {
          name: '项目列表',
          path: '/dashboard/projects',
          icon: 'List',
          parentId: projectsMenu.id,
          order: 1,
          isVisible: true
        }
      });

      // 为子菜单关联project.view权限
      if (projectViewPermission) {
        await prisma.menuPermission.create({
          data: {
            menuId: projectListMenu.id,
            permissionId: projectViewPermission.id
          }
        });
        console.log(`为子菜单添加权限: ${projectListMenu.name} - project.view`);
      }
    }

    console.log(`添加/更新子菜单: ${projectListMenu.name}`);

    // 如果已经存在子菜单 "创建项目"，删除它
    let createProjectMenu = await prisma.menu.findFirst({
      where: { path: '/dashboard/projects/new' }
    });

    if (createProjectMenu) {
      // 删除相关的权限关联
      await prisma.menuPermission.deleteMany({
        where: { menuId: createProjectMenu.id }
      });

      // 删除菜单项
      await prisma.menu.delete({
        where: { id: createProjectMenu.id }
      });

      console.log(`删除子菜单: 创建项目`);
    }

    console.log('项目管理菜单修复完成');
  } catch (error) {
    console.error('修复项目管理菜单失败:', error);
  }
}

/**
 * 确保管理员拥有项目管理的所有权限
 */
export async function ensureAdminProjectPermissions() {
  console.log('开始确保管理员拥有项目管理权限...');

  try {
    // 查找管理员角色
    const adminRole = await prisma.role.findFirst({
      where: { name: 'admin' }
    });

    if (!adminRole) {
      console.log('未找到管理员角色');
      return;
    }

    // 项目管理相关权限列表
    const projectPermissions = [
      { name: 'project.view', description: '查看项目列表和项目详情' },
      { name: 'project.create', description: '创建新项目' },
      { name: 'project.update', description: '编辑项目信息' },
      { name: 'project.delete', description: '删除项目' },
      { name: 'project.member.manage', description: '管理项目成员' },
      { name: 'project.setting.manage', description: '管理项目设置' },
      { name: 'task.view', description: '查看任务详情' },
      { name: 'task.create', description: '创建新任务' },
      { name: 'task.update', description: '编辑任务信息' },
      { name: 'task.delete', description: '删除任务' },
      { name: 'task.assign', description: '分配任务给成员' },
      { name: 'task.status.update', description: '更新任务状态' },
      { name: 'sprint.view', description: '查看迭代详情' },
      { name: 'sprint.create', description: '创建新迭代' },
      { name: 'sprint.update', description: '编辑迭代信息' },
      { name: 'sprint.delete', description: '删除迭代' },
      { name: 'sprint.manage_tasks', description: '管理迭代中的任务' },
      { name: 'document.view', description: '查看文档' },
      { name: 'document.create', description: '创建文档' },
      { name: 'document.update', description: '编辑文档' },
      { name: 'document.delete', description: '删除文档' }
    ];

    // 确保所有项目权限存在并分配给管理员
    for (const permissionData of projectPermissions) {
      // 查找或创建权限
      let permission = await prisma.permission.findFirst({
        where: { name: permissionData.name }
      });

      if (!permission) {
        permission = await prisma.permission.create({
          data: permissionData
        });
        console.log(`创建权限: ${permission.name}`);
      }

      // 将权限分配给管理员角色
      const rolePermission = await prisma.rolePermission.findFirst({
        where: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      });

      if (!rolePermission) {
        await prisma.rolePermission.create({
          data: {
            roleId: adminRole.id,
            permissionId: permission.id
          }
        });
        console.log(`将权限 ${permission.name} 分配给管理员角色`);
      }
    }

    console.log('管理员项目权限确认完成');
  } catch (error) {
    console.error('确保管理员项目权限失败:', error);
  }
}

/**
 * 修复项目菜单并确保管理员拥有相关权限
 */
export async function fixProjectMenuAndPermissions() {
  try {
    await fixProjectMenus();
    await ensureAdminProjectPermissions();
    console.log('项目菜单和权限修复完成');
  } catch (error) {
    console.error('修复项目菜单和权限失败:', error);
  }
}
