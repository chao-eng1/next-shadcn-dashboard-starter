import { prisma } from './prisma';

/**
 * 为管理员角色分配项目管理权限
 */
export async function assignAdminProjectPermissions() {
  console.log('开始为管理员分配项目管理权限...');

  // 查找管理员角色
  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' }
  });

  if (!adminRole) {
    console.log('未找到管理员角色');
    return {
      success: false,
      message: '未找到管理员角色'
    };
  }

  // 获取所有项目管理权限
  const projectPermissions = await prisma.permission.findMany({
    where: {
      OR: [
        { name: { startsWith: 'project.' } },
        { name: { startsWith: 'task.' } },
        { name: { startsWith: 'sprint.' } },
        { name: { startsWith: 'comment.' } },
        { name: { startsWith: 'attachment.' } },
        { name: { startsWith: 'document.' } }
      ]
    }
  });

  console.log(`找到 ${projectPermissions.length} 个项目管理权限`);

  // 如果没有找到权限，先创建基本权限
  if (projectPermissions.length === 0) {
    await createProjectPermissions();

    // 重新获取权限
    const newProjectPermissions = await prisma.permission.findMany({
      where: {
        OR: [
          { name: { startsWith: 'project.' } },
          { name: { startsWith: 'task.' } },
          { name: { startsWith: 'sprint.' } },
          { name: { startsWith: 'comment.' } },
          { name: { startsWith: 'attachment.' } },
          { name: { startsWith: 'document.' } }
        ]
      }
    });

    console.log(`创建并找到 ${newProjectPermissions.length} 个项目管理权限`);

    // 为管理员角色分配所有项目管理权限
    for (const permission of newProjectPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      });

      console.log(`为管理员分配权限: ${permission.name}`);
    }
  } else {
    // 为管理员角色分配所有项目管理权限
    for (const permission of projectPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      });

      console.log(`为管理员分配权限: ${permission.name}`);
    }
  }

  console.log('管理员权限分配完成');
  return {
    success: true,
    message: '管理员权限分配完成'
  };
}

/**
 * 创建项目管理基本权限
 */
async function createProjectPermissions() {
  // 项目权限
  const projectPermissions = [
    { name: 'project.view', description: '查看项目' },
    { name: 'project.create', description: '创建项目' },
    { name: 'project.update', description: '更新项目' },
    { name: 'project.delete', description: '删除项目' },
    { name: 'project.member.manage', description: '管理项目成员' }
  ];

  // 任务权限
  const taskPermissions = [
    { name: 'task.view', description: '查看任务' },
    { name: 'task.create', description: '创建任务' },
    { name: 'task.update', description: '更新任务' },
    { name: 'task.delete', description: '删除任务' },
    { name: 'task.assign', description: '分配任务' }
  ];

  // 迭代权限
  const sprintPermissions = [
    { name: 'sprint.view', description: '查看迭代' },
    { name: 'sprint.create', description: '创建迭代' },
    { name: 'sprint.update', description: '更新迭代' },
    { name: 'sprint.delete', description: '删除迭代' }
  ];

  // 文档权限
  const documentPermissions = [
    { name: 'document.view', description: '查看文档' },
    { name: 'document.create', description: '创建文档' },
    { name: 'document.update', description: '更新文档' },
    { name: 'document.delete', description: '删除文档' }
  ];

  // 评论权限
  const commentPermissions = [
    { name: 'comment.view', description: '查看评论' },
    { name: 'comment.create', description: '创建评论' },
    { name: 'comment.update', description: '更新评论' },
    { name: 'comment.delete', description: '删除评论' }
  ];

  // 附件权限
  const attachmentPermissions = [
    { name: 'attachment.view', description: '查看附件' },
    { name: 'attachment.create', description: '上传附件' },
    { name: 'attachment.delete', description: '删除附件' }
  ];

  // 合并所有权限
  const allPermissions = [
    ...projectPermissions,
    ...taskPermissions,
    ...sprintPermissions,
    ...documentPermissions,
    ...commentPermissions,
    ...attachmentPermissions
  ];

  // 批量创建权限
  for (const permission of allPermissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: { description: permission.description },
      create: {
        name: permission.name,
        description: permission.description
      }
    });

    console.log(`创建权限: ${permission.name}`);
  }
}
